<template>
    <div id="cesiumContainer"></div>
    <div class="lnglat">
        经度:{{ lnglat.longitude }} &nbsp;纬度:{{ lnglat.latitude }}
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, onUnmounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { getCurrentPositionByMouse } from '../../utils/cesiumTools'
import PrimitiveCluster from "../../utils/primitiveCluster";

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer' })

// let billboardsCollection;
let billboardsCollectionCombine;
let primitives;
let scene;
let primitivesCollection

onMounted(() => {
    cesiumV = getCesiumViewer()
    getLngLat()
    // 先把广告牌实例化，然后再添加到场景中
    // billboardsCollection = cesiumV.scene.primitives.add(
    //     new Cesium.BillboardCollection()
    // );
    // 初始化实体
    // primitives = cesiumV.scene.primitives.add(
    //     new Cesium.PrimitiveCollection()
    // );
    // billboardsCollectionCombine = new Cesium.BillboardCollection();
    scene = cesiumV.scene;
    // onCluster()
})



//根据鼠标获取经纬度
const lnglat = reactive({
    longitude: 0,
    latitude: 0,
    height: 0
})
const getLngLat = () => {
    Cesium.BillboardCollection
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas)

    handler.setInputAction((movement) => {
        const lnglathig = getCurrentPositionByMouse(cesiumV.scene, movement.endPosition, null)
        if (Cesium.defined(lnglathig)) {
            let carto = Cesium.Cartographic.fromCartesian(lnglathig);
            lnglat.latitude = Number(Cesium.Math.toDegrees(carto.latitude).toFixed(3));
            lnglat.longitude = Number(Cesium.Math.toDegrees(carto.longitude).toFixed(3));
            lnglat.height = Number(carto.height.toFixed(1));
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}


const onCluster = () => {
    fetch('https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson').then((res) => {
        return res.json()
    }).then((data) => {
        const { features } = data;
        // console.log(features);
        formatClusterPoint(features);
    })
};
const formatClusterPoint = (features) => {
    primitivesCollection = new Cesium.PrimitiveCollection();
    billboardsCollectionCombine = new Cesium.BillboardCollection();
    // var scene = cesiumV.scene;
    let primitivecluster;
    primitivecluster = new PrimitiveCluster();

    //与entitycluster相同设置其是否聚合 以及最大最小值
    primitivecluster.enabled = true;
    primitivecluster.pixelRange = 60;
    primitivecluster.minimumClusterSize = 2;
    // primitivecluster._pointCollection = pointCollection;
    // primitivecluster._labelCollection = labelCollection;

    //后面设置聚合的距离及聚合后的图标颜色显示与官方案例一样
    for (let i = 0; i < features.length; i++) {
        const feature = features[i];

        const coordinates = feature.geometry.coordinates;
        const position = Cesium.Cartesian3.fromDegrees(
            coordinates[0],
            coordinates[1],
            2000
        );

        // 带图片的点
        billboardsCollectionCombine.add({
            image: "/images/mark-icon.png",
            width: 32,
            height: 32,
            position,
        });
    }
    console.log(billboardsCollectionCombine);

    primitivecluster._billboardCollection = billboardsCollectionCombine;
    // 同时在赋值时调用_initialize方法
    // debugger
    // primitivecluster._initialize(cesiumV.scene);
    // primitivesCollection.add(primitivecluster);
    // primitives = cesiumV.scene.primitives.add(primitivesCollection);

    // primitivecluster.clusterEvent.addEventListener(
    //     (clusteredEntities, cluster) => {
    //         // console.log("clusteredEntities", clusteredEntities);
    //         // console.log("cluster", cluster);
    //         // 关闭自带的显示聚合数量的标签
    //         cluster.label.show = false;
    //         cluster.billboard.show = true;
    //         cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;

    //         // 根据聚合数量的多少设置不同层级的图片以及大小
    //         cluster.billboard.image = combineIconAndLabel(
    //             "/images/school-icon.png",
    //             clusteredEntities.length,
    //             64
    //         );
    //         // cluster.billboard.image = "/images/school-icon.png";
    //         cluster.billboard._imageHeight = 60;
    //         cluster.billboard._imageWidth = 60;
    //         cluster.billboard._dirty = false;
    //         cluster.billboard.width = 40;
    //         cluster.billboard.height = 40;
    //     }
    // );
    return primitivecluster;
};
/**
 * @description: 将图片和文字合成新图标使用（参考Cesium源码）
 * @param {*} url：图片地址
 * @param {*} label：文字
 * @param {*} size：画布大小
 * @return {*} 返回canvas
 */
const combineIconAndLabel = (url, label, size) => {
    // 创建画布对象
    let canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    let ctx = canvas.getContext("2d");

    let promise = Cesium.Resource.fetchImage(url)?.then((image) => {
        // 异常判断
        try {
            ctx?.drawImage(image, 0, 0);
        } catch (e) {
            console.log(e);
        }

        // 渲染字体
        // font属性设置顺序：font-style, font-variant, font-weight, font-size, line-height, font-family
        ctx!.fillStyle = Cesium.Color.BLACK.toCssColorString();
        ctx!.font = "bold 20px Microsoft YaHei";
        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.fillText(label, size / 2, size / 2);

        return canvas;
    });
    return promise;
}

</script>

<style scoped>
#cesiumContainer {
    height: 100vh;
}

.lnglat {
    position: absolute;
    top: 2%;
    left: 3%;
    width: 300px;
    height: 40px;
    text-align: center;
    line-height: 40px;
    font-size: 16px;
    border-radius: 3px;
    background-color: beige;
}
</style>