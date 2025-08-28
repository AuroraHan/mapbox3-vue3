<!--  -->
<template>
    <div id="cesiumContainer"></div>
    <div class="show-info">
        经度:{{ position.longitude.toFixed(4) }}
        纬度:{{ position.latitude.toFixed(4) }}
        高空:{{ position.height.toFixed(2) }}km
        层级:{{ bounds.level }}
    </div>
    <div class="options">
        <el-button type="primary" @click="drawPolygon">绘制面</el-button>
    </div>
</template>

<script setup lang='ts'>
import { onMounted, ref, computed, watch } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { CesiumEvent } from '/@/utils/cesiumEvent'
import { useCesiumEventStore } from '/@/stores/cesiumStore'
import { InteractivePolygon } from './interactivePolygon';


const cesiumEventStore = useCesiumEventStore();
const position = computed(() => cesiumEventStore.mouseMovePostion);
const bounds = computed(() => cesiumEventStore.bounds);

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', addTerrain: true, infoBox: false, shouldAnimate: true })

onMounted(() => {
    cesiumV = getCesiumViewer()
    // addTerrainLine()
    new CesiumEvent(cesiumV)
})


//添加等高线
const addTerrainLine = () => {
    cesiumV.scene.skyAtmosphere.show = true;
    cesiumV.shadows = true
    addLine([
        [110.88106709929548, 30.10536702913351, 1187.5288999303148],
        [110.8834848758976, 30.04803830643123, 923.651454152295],
        [110.93732277846644, 30.048178667944597, 597.5883761989865],
        [110.95818944973519, 30.08307354872316, 1011.2606325887339],
        // [110.92957034551483, 30.09950535924442, 1180.6223600558253],
    ]);
}

const addLine = (positions: any) => {
    let positionsHieght = Cesium.Cartesian3.fromDegreesArrayHeights(
        [].concat.apply([], positions)
    );
    let m = Cesium.Transforms.eastNorthUpToFixedFrame(positionsHieght[0]);
    let inverse = Cesium.Matrix4.inverse(m, new Cesium.Matrix4());
    let localPositions: any = [];
    positionsHieght.forEach((position) => {
        localPositions.push(
            Cesium.Matrix4.multiplyByPoint(
                inverse,
                position,
                new Cesium.Cartesian3()
            )
        );
    });

    //计算矩形范围
    let rect = Cesium.BoundingRectangle.fromPoints(
        localPositions,
        new Cesium.BoundingRectangle()
    );

    rect = new Cesium.Cartesian4(
        rect.x,
        rect.y,
        rect.x + rect.width,
        rect.y + rect.height
    );
    Cesium.Material._materialCache._materials.ElevationContour.fabric.source = `
    uniform vec4 color;
    uniform float spacing;
    uniform float width;  
    uniform vec4 rect;  
    uniform vec4 m_0;  
    uniform vec4 m_1;  
    uniform vec4 m_2;  
    uniform vec4 m_3;  

    czm_material czm_getMaterial(czm_materialInput materialInput)
    {
        czm_material material = czm_getDefaultMaterial(materialInput); 
        float distanceToContour = mod(materialInput.height, spacing);
        
        #if (__VERSION__ == 300 || defined(GL_OES_standard_derivatives))
        float dxc = abs(dFdx(materialInput.height));
        float dyc = abs(dFdy(materialInput.height));
        float dF = max(dxc, dyc) * czm_pixelRatio * width;
        float alpha = (distanceToContour < dF) ? 1.0 : 0.0;
        #else
        // If no derivatives available (IE 10?), use pixel ratio
        float alpha = (distanceToContour < (czm_pixelRatio * width)) ? 1.0 : 0.0;
        #endif
        
        vec4 outColor = czm_gammaCorrect(vec4(color.rgb, alpha * color.a));
        material.diffuse = outColor.rgb; 
        mat4 m=mat4(m_0[0],m_0[1],m_0[2],m_0[3],m_1[0],m_1[1],m_1[2],m_1[3],m_2[0],m_2[1],m_2[2],m_2[3],m_3[0],m_3[1],m_3[2],m_3[3]);
         
        vec4 eyeCoordinate =vec4(-materialInput.positionToEyeEC,1.0); 
        vec4 worldCoordinate4 =  czm_inverseView * eyeCoordinate;
        vec3 worldCoordinate = worldCoordinate4.xyz ;// worldCoordinate4.w;
        vec4 local=m * vec4(worldCoordinate,1.);  
        material.alpha =0.;    
        if(local.x>rect.x&&local.x<rect.z&&local.y<rect.w&&local.y>rect.y){  
        material.alpha = outColor.a;     
        } 
        return material;
    }
    `;
    let material = new Cesium.Material({
        fabric: {
            type: "ElevationContour",
            uniforms: {
                width: 1,
                spacing: 200,
                color: Cesium.Color.YELLOW,
                rect: rect,
                m_0: new Cesium.Cartesian4(
                    inverse[0],
                    inverse[1],
                    inverse[2],
                    inverse[3]
                ),
                m_1: new Cesium.Cartesian4(
                    inverse[4],
                    inverse[5],
                    inverse[6],
                    inverse[7]
                ),
                m_2: new Cesium.Cartesian4(
                    inverse[8],
                    inverse[9],
                    inverse[10],
                    inverse[11]
                ),
                m_3: new Cesium.Cartesian4(
                    inverse[12],
                    inverse[13],
                    inverse[14],
                    inverse[15]
                ),
            },
        },
    });
    cesiumV.scene.globe.material = material;
    cesiumV.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            positions[0][0],
            positions[0][1],
            10000
        ),
        orientation: {},
    });
};

const onClick = () => {
    let west = 110.88106709929548;
    let south = 30.048178667944597;
    let east = 110.95818944973519;
    let north = 30.10536702913351;
    addContourLabels(cesiumV, { west, south, east, north }, 200)
}

const addContourLabels = async (viewer: Cesium.Viewer, rect: any, spacing: number) => {
    const terrainProvider = viewer.terrainProvider;

    // 1. 计算采样点（经纬度网格）
    const step = 0.002; // 网格间隔，单位°，越小越精细
    const positions = [];
    for (let lon = rect.west; lon <= rect.east; lon += step) {
        for (let lat = rect.south; lat <= rect.north; lat += step) {
            positions.push(Cesium.Cartographic.fromDegrees(lon, lat));
        }
    }

    // 2. 采样高度
    const updatedPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, positions);

    // 3. 找到区域的高程范围
    let minHeight = Number.POSITIVE_INFINITY;
    let maxHeight = Number.NEGATIVE_INFINITY;
    updatedPositions.forEach(p => {
        if (p.height < minHeight) minHeight = p.height;
        if (p.height > maxHeight) maxHeight = p.height;
    });

    // 4. 生成所有等高线高度值
    const contourHeights = [];
    for (let h = Math.floor(minHeight / spacing) * spacing; h <= maxHeight; h += spacing) {
        contourHeights.push(h);
    }

    // 5. 找到等高线附近的点（容差 ±spacing*0.05）
    const tolerance = spacing * 0.05;
    contourHeights.forEach(heightVal => {
        let count = 0;
        updatedPositions.forEach(p => {
            if (Math.abs(p.height - heightVal) < tolerance) {
                // 每条等高线只取几个点做标签
                if (count % 5 === 0) {
                    viewer.entities.add({
                        position: Cesium.Cartesian3.fromRadians(p.longitude, p.latitude, heightVal),
                        label: {
                            text: `${Math.round(heightVal)} m`,
                            font: "14px sans-serif",
                            fillColor: Cesium.Color.YELLOW,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            outlineWidth: 2,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, -10),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY
                        }
                    });
                }
                count++;
            }
        });
    });
}

//绘制
let polygon: any = null;
const mouseMovePostion = computed(() => cesiumEventStore.mouseMovePostion);
const leftClickPosition = computed(() => cesiumEventStore.leftClickPosition);
const rightClickPosition = computed(() => cesiumEventStore.rightClickPosition);

watch(
    leftClickPosition,
    (position) => {
        if (!polygon) return;
        polygon.leftClickPosition({ ...position });
    },
    { deep: true }
);
watch(
    rightClickPosition,
    () => {
        if (!polygon) return;
        polygon.rightClickPosition();
    },
    { deep: true }
);
watch(
    mouseMovePostion,
    (position) => {
        if (!polygon) return;
        polygon.mouseMovePosition({ ...position });
    },
    { deep: true }
);


const drawPolygon = () => {
    if (polygon) {
        polygon.clearDrawing();
        polygon = null;
    } else {
        polygon = new InteractivePolygon(cesiumV);
    }

}

</script>
<style scoped lang='scss'>
#cesiumContainer {
    height: 100vh;
}

.show-info {
    position: absolute;
    left: 1%;
    top: 2%;
    width: 28%;
    min-height: 35px;
    text-align: center;
    line-height: 35px;
    background-color: rgb(239, 139, 63);
    border-radius: 5px;
}

.options {
    position: absolute;
    right: 2%;
    top: 20%;
    width: 10%;
    min-height: 80px;
    background-color: aqua;
}
</style>