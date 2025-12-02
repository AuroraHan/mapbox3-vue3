<!--  -->
<template>
    <div>
        <div class="title">图上量算</div>
        <div class="btns">
            <el-button type="success" @click="measure">测距离</el-button>
            <el-button disabled type="success">测距离</el-button>
            <!-- <el-button disabled type="success">测高程</el-button> -->
            <el-button disabled type="success">测高差</el-button>
            <el-button disabled type="success">测面积</el-button>
            <el-button disabled type="success">测角度</el-button>
            <el-button type="danger" @click="onClear">全清空</el-button>
        </div>
    </div>
</template>

<script setup lang='ts'>
import * as Cesium from 'cesium';
import { inject } from 'vue'
import { useCesiumS } from '@/stores/cesiumStore'

// const { viewer } = useCesiumS()

let cViewer = inject('myViewer') as Cesium.Viewer

// 存储起点和终点
let points = [] as any;
// 存储测量距离的事件函数
let measureHandler: Cesium.ScreenSpaceEventHandler;
//测距离
const measure = () => {
    if (!cViewer) return
    let cesiumV = cViewer

    let distanceLabel; // 显示距离的标签
    let pointEntity;
    let lineEntity; // 存储两点之间的连线

    // 监听点击事件
    measureHandler = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas);
    measureHandler.setInputAction((click) => {
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

    measureHandler.setInputAction((click) => {
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

const onClear = () => {
    try {
        cViewer?.entities.removeAll()
        points = []
        measureHandler.destroy()
    } catch (error) {
        console.error(error)
    }

}

</script>
<style scoped lang='scss'>
.title {
    text-align: center;
    font-size: 17px;
    font-weight: bold;
    margin-bottom: 10px;
}

.btns {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
    align-items: center;

    :deep(.el-button) {
        margin-left: 0px;
        margin-bottom: 4px;
    }
}
</style>