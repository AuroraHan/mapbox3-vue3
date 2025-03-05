<template>
    <!-- 工具集 -->
    <div id="cesiumContainer"></div>
    <div class="tools">
        <div class="item">
            <div class="title">直线距离计算</div>
            <el-switch />
        </div>
    </div>
    <Coordinates :viewer="cesiumV"></Coordinates>
</template>

<script setup lang="ts">
import { onMounted, ref, provide } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import Coordinates from './components/coordinates/index.vue'

let cesiumV = ref<Cesium.Viewer>();
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', timeline: false, animation: false })

const flag = ref(false)

onMounted(() => {
    cesiumV.value = getCesiumViewer()
    // measure()
})

//标绘信息
const measure = (cesiumV: Cesium.Viewer) => {
    let points = [] as any; // 存储起点和终点
    let distanceLabel; // 显示距离的标签
    let pointEntity;
    let lineEntity; // 存储两点之间的连线

    // 监听点击事件
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas);
    handler.setInputAction((click) => {
        // 获取点击位置的笛卡尔坐标
        const ray = cesiumV.camera.getPickRay(click.position);
        const cartesian = cesiumV.scene.globe.pick(ray!, cesiumV.scene);

        if (cartesian && points.length < 2) {
            // 添加点实体
            pointEntity = cesiumV.entities.add({
                position: cartesian,
                point: { pixelSize: 10, color: Cesium.Color.RED }
            });

            points.push(cartesian);
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction((click) => {
        // 当选择两个点时计算距离
        if (points.length === 2) {
            const distance = Cesium.Cartesian3.distance(points[0], points[1]);

            // 绘制两点之间的实线
            if (lineEntity) {
                cesiumV.entities.remove(lineEntity); // 移除之前的线
            }
            lineEntity = cesiumV.entities.add({
                polyline: {
                    positions: points,
                    width: 3,
                    material: Cesium.Color.YELLOW
                }
            });


            // 显示距离标签
            if (!distanceLabel) {
                distanceLabel = cesiumV.entities.add({
                    position: Cesium.Cartesian3.midpoint(points[0], points[1], new Cesium.Cartesian3()),
                    label: {
                        text: `直线距离: ${Number(distance / 1000).toFixed(2)} 千米`,
                        font: '20px Arial',
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 2,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                        pixelOffset: new Cesium.Cartesian2(0, 20) // 调整像素偏移
                    },
                });
            } else {
                distanceLabel.position = Cesium.Cartesian3.midpoint(points[0], points[1], new Cesium.Cartesian3());
                distanceLabel.label.text = `直线距离: ${distance.toFixed(2)} 米`;
            }


            // 重置点集合，允许重新测量
            // points = [];
            // cesiumV.entities.remove(pointEntity); // 移除临时点
        }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}

</script>

<style lang="scss" scoped>
#cesiumContainer {
    height: 100vh;
    width: 100%;
}

.tools {
    position: absolute;
    top: 2%;
    left: 3%;
    width: 200px;
    // height: 40px;
    font-size: 18px;
    border-radius: 3px;
    background-color: beige;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .item {
        display: flex;
        align-items: center;
        line-height: 40px;
        font-weight: bold;
        color: rgb(49, 58, 55);

        .title {
            margin-right: 10px;
        }
    }
}
</style>