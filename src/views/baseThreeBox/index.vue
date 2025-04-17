<template>
    <div id="map" class="map"></div>
    <pre
        class="lonlat">经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}</pre>
    <div class="box">3D</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as THREE from 'three';
import { Threebox } from 'threebox-plugin';
import lodash from 'lodash'
import { useMapbox } from '../../hooks/useMapBox'
import * as Turf from '@turf/turf'
import mapboxgl from 'mapbox-gl';
import { Mapbox } from '@antv/l7';

let mapR: mapboxgl.Map;
let tb: any;

const { getMap } = useMapbox({ container: 'map', isOffline: false })

onMounted(() => {
    baseConfig()
    // getTextData()
    // rondomPar()
})

//当前经纬度
const jw = ref<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

//当前缩放层级
const zoom = ref<Number>(0)


const baseConfig = () => {
    mapR = getMap()!

    //@ts-ignore
    tb = window.tb = new Threebox(
        mapR,
        mapR.getCanvas().getContext('webgl'), //get the context from the map canvas
        { defaultLights: true }
    );
    mapR.on('mousemove', (e: { lngLat: { lat: number, lng: number } }) => {
        jw.value = e.lngLat;
    })

    mapR.on('zoom', () => {
        zoom.value = mapR.getZoom() as Number;
    })

    mapR.on('load', () => {
        // getTextData()
        addCustomPoint()
    })
}

let row = 201;
let column = 198;
//加载热力图实例
const getTextData = async () => {
    const res = await fetch('/data/grid.txt')
    const result = await res.text()
    const alllines = arrSplit(tb, result)
    mapR.addLayer({
        id: 'heatmap',
        type: 'custom',
        onAdd: function (map, gl) {
            // this.map = map;
            let lineGroup = new THREE.Group();
            tb.add(lineGroup);
            let lineMesh = null;
            alllines.forEach((line, index) => {
                lineMesh = drawLine(line);
                // lineMesh.userdata = { index: index }
                lineGroup.add(lineMesh)
            });
        },
        render: function (gl, matrix) {
            // if (this.map)
            //     this.map.triggerRepaint();
            if (tb)
                tb.update();
        }
    })

}

const drawLine = (row: Array<any>) => {
    let vertices: Array<any> = [];
    let colors: Array<any> = [];
    let geometry = new THREE.BufferGeometry();
    row.forEach(coordinate => {
        let [x, y, z] = [coordinate[0], coordinate[1], coordinate[2]];
        vertices.push(x, y, z);
        const color = getColorByValue(z);
        colors.push(color.r, color.g, color.b); // 颜色按 [r,g,b] 顺序填充
    });

    let material = new THREE.LineBasicMaterial({
        opacity: 1,
        linewidth: 1,
        vertexColors: true,
        // blending: THREE.AdditiveBlending
    });

    // 3. 设置顶点坐标（必须为 Float32Array）
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3) // 3 表示每个顶点的分量数（x,y,z）
    );

    // 4. 设置顶点颜色（必须为 Float32Array）
    geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3) // 3 表示颜色分量数（r,g,b）
    );

    let lineMesh = new THREE.Line(geometry, material);
    return lineMesh;
}

const arrSplit = (tb: any, datStr: string) => {
    let resArr = dataFormat(tb, datStr);
    let rows = lodash.chunk(resArr, row);
    let colums = [];
    let tmpColums = [];
    for (let i = 0; i < row; i++) {
        for (let j = 0; j < column; j++) {
            let item = resArr[row * j + i]
            tmpColums.push(item);
        }
    }
    colums = lodash.chunk(tmpColums, column);
    return [...rows, ...colums];
}

//将文件中数据经纬度转换为mapbox中投影坐标
const dataFormat = (tb: any, dataStr: string) => {
    let points: Array<any> = [];
    dataStr.split('\n').map(function (s, i) {
        let splitArray = s.split(',');
        var ll = [parseFloat(splitArray[0]), parseFloat(splitArray[1])];
        let {
            x,
            y,
            z
        } = tb.projectToWorld(ll)

        points.push([...[x, y], ...splitArray.splice(2).map(i => Number(i))])
    });
    return points;
}

let colors = [
    new THREE.Color(`rgb( 113, 196, 54)`),
    new THREE.Color(`rgb( 113, 196, 54)`),
    new THREE.Color(`rgb( 171, 190, 52)`),
    new THREE.Color(`rgb( 201, 155, 52)`),
    new THREE.Color(`rgb( 205, 122, 45)`),
    new THREE.Color(`rgb( 214, 96, 53)`),
    new THREE.Color(`rgb( 234, 57, 45)`),
    new THREE.Color(`rgb( 234, 57, 45)`)

]
const getColorByValue = (value: any) => {
    let tvalue = Number(value)
    if (tvalue < 3) {
        return colors[0];
    } else if (tvalue < 5) {
        return colors[1];
    } else if (tvalue <= 8) {
        return colors[2];
    } else if (tvalue < 10) {
        return colors[3];
    } else if (tvalue < 15) {
        return colors[4];
    } else if (tvalue < 30) {
        return colors[5];
    } else if (tvalue < 50) {
        return colors[6];
    } else {
        return colors[7];
    }
}


const addCustom = () => {
    mapR.addLayer({
        id: 'box1',
        type: 'custom',
        onAdd: function (map, gl) {
            // let geometry = new THREE.BoxGeometry(3000, 3000, 3000);
            const geometry = new THREE.ConeGeometry(1000, 1000, 32);
            let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0xffff00 }));

            const cube = tb.Object3D({ obj: mesh, units: 'meters', adjustment: { x: 0.5, y: 1, z: -0.5 } });
            cube.rotation.x = Math.PI / 2
            cube.setCoords([112, 31]);
            tb.add(cube);
        },
        render: function (gl, matrix) {
            tb.update(); //update Threebox scene
        }
    })
}

//在粒子上添加纹理贴图
const addSmokeMaterial = () => {
    const textureLoader = new THREE.TextureLoader();
    const smokeTexture = textureLoader.load('/images/smoke1.png');
    const positions = [];
    const geometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x888888,
        size: 100,
        map: smokeTexture,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    const n = 2000, n2 = n / 2; // particles spread in the cube
    const height = 300; // 圆锥体高度
    const radius = 200; // 底部圆的半径

    for (let i = 0; i < 2000; i++) {
        // y 坐标从 0 到 -height 范围
        const y = -Math.random() * height;

        // 根据 y 坐标计算半径，使其随高度增大
        const r = (1 + y / height) * radius;

        // 生成围绕圆锥体中心的角度 theta
        const theta = Math.random() * 2 * Math.PI;

        // x 和 z 坐标基于半径 r 和角度 theta 来计算
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        // 将计算得到的 x, y, z 添加到 positions 数组中
        positions.push(x, y, z);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    const particleSystem = new THREE.Points(geometry, particleMaterial);

    let cube;
    mapR.addLayer({
        id: 'smoke',
        type: 'custom',
        onAdd: function (map, gl) {
            cube = tb.Object3D({ obj: particleSystem, units: 'meters', adjustment: { x: 0, y: 1, z: 0 } });
            cube.rotation.x = Math.PI / 2
            cube.setCoords([112, 31]);
            tb.add(cube);
        },
        render: function (gl, matrix) {
            // cube.rotation.y += 0.01;
            tb.update();
        }
    });
}

//------------案例三----------

//随机生成一定范围内粒子
const rondomPar = (tb: any) => {
    //设置中心点
    const conter = Turf.point([112, 31])
    const rondomParArr = []

    for (let index = 0; index < 10000; index++) {
        //角度 0-90
        const bearing = Math.floor(Math.random() * 90);
        const distance = Number(Math.random().toFixed(2));
        const height = Number((Math.random() * 100).toFixed(2))
        let destination = Turf.rhumbDestination(conter, distance, bearing, { units: "kilometers" });
        let {
            x,
            y,
        } = tb.projectToWorld(destination.geometry.coordinates)
        const point = [x, y, height]
        rondomParArr.push(point)
    }


    return rondomParArr
}
//生成点位
const drawPoint = (row: Array<any>) => {
    let vertices: Array<any> = [];
    let colors: Array<any> = [];
    let geometry = new THREE.BufferGeometry();
    row.forEach(coordinate => {
        let [x, y, z] = [coordinate[0], coordinate[1], coordinate[2]];
        vertices.push(x, y, z);
        const color = getColorByValue(z);
        colors.push(color.r, color.g, color.b); // 颜色按 [r,g,b] 顺序填充
    });

    const material = new THREE.PointsMaterial({ size: 10, vertexColors: true });

    // 3. 设置顶点坐标（必须为 Float32Array）
    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3) // 3 表示每个顶点的分量数（x,y,z）
    );

    // 4. 设置顶点颜色（必须为 Float32Array）
    geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3) // 3 表示颜色分量数（r,g,b）
    );

    let pointMesh = new THREE.Points(geometry, material);
    return pointMesh;
}

const addCustomPoint = () => {

    mapR.addLayer({
        id: 'heatmap',
        type: 'custom',
        onAdd: function (map, gl) {
            // this.map = map;
            const list = rondomPar(tb)
            let pointMesh = drawPoint(list);
            tb.add(pointMesh)
        },
        render: function (gl, matrix) {
            // if (this.map)
            //     this.map.triggerRepaint();
            if (tb)
                tb.update();
        }
    })
}

</script>

<style lang="scss" scoped>
.map {
    height: 100vh;
}

.lonlat {
    z-index: 9;
    width: 320px;
    font-size: 15px;
    line-height: 35px;
    padding: 0 3px;
    height: 35px;
    background-color: rgb(191, 192, 192);
    position: absolute;
    bottom: 3%;
    left: 3%;
    text-align: center;
}

.box {
    width: 50px;
    height: 50px;
    text-align: center;
    position: absolute;
    left: 1%;
    bottom: 10%;
    z-index: 9;
    background-color: red;
}
</style>
