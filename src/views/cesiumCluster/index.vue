<template>
    <div id="cesiumContainer"></div>
    <div class="lnglat">
        经度:{{ lnglat.longitude }} &nbsp;纬度:{{ lnglat.latitude }}
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { getCurrentPositionByMouse } from '../../utils/cesiumTools'
import { randomGeoJsonPoint } from './tools'
import { FeatureCollection } from 'geojson';
import Dialog from '../../utils/cesiumDialog'

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', infoBox: true })


onMounted(() => {
    cesiumV = getCesiumViewer()
    getLngLat()
    onCluster()
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
    const cluster = new Cluster({ viewer: cesiumV })
    cluster.clickMouseLeft()
};

class Cluster {
    viewer: Cesium.Viewer;
    geojson: null | FeatureCollection<GeoJSON.Point>;
    dataSources: Cesium.DataSource;
    colorArr = [
        {
            num: 1,
            size: 30,
            color: "#1c86d1cc",
        },
        {
            num: 50,
            size: 32,
            color: "#67c23acc",
        },
        {
            num: 100,
            size: 34,
            color: "#f56c6ccc",
        },
        {
            num: 200,
            size: 36,
            color: "#e6a23ccc",
        },
    ]
    img = "/images/icon.png"
    constructor(options) {
        this.viewer = options.viewer;
        this.geojson = randomGeoJsonPoint(100, 130, 20, 40, 500)
        this.loadJson()
    }

    loadJson() {
        new Cesium.GeoJsonDataSource().load(this.geojson).then((data) => {
            this.showCluster(data)
        })
    }

    //展示聚合数据
    showCluster(geoJsonDataSource) {
        const _this = this

        this.dataSources = geoJsonDataSource
        this.dataSources.clustering.enabled = true;
        this.dataSources.clustering.pixelRange = 62;
        this.dataSources.clustering.minimumClusterSize = 1;
        this.viewer.dataSources.add(this.dataSources!);

        let removeListener;

        function customStyle() {

            if (Cesium.defined(removeListener)) {
                removeListener();
                removeListener = undefined;
            } else {
                removeListener = _this.dataSources.clustering.clusterEvent.addEventListener(async (clusteredEntities, cluster) => {
                    cluster.label.show = false;
                    cluster.billboard.show = true;
                    cluster.billboard.id = cluster.label.id;
                    cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.CENTER;

                    let xx = -1;
                    for (let i = 0; i < _this.colorArr.length; i++) {
                        if (
                            clusteredEntities.length > _this.colorArr[i].num
                        ) {
                            xx = i;
                        }
                    }
                    if (xx == -1) {
                        cluster.billboard.image = _this.img;
                        cluster.billboard.scale = 0.2
                    } else {
                        //@ts-ignore
                        cluster.billboard.image = await combineIconAndLabel('/images/school-icon.png', clusteredEntities.length, 70)
                        cluster.billboard.scale = 0.5
                    }
                })
            }

            var pixelRange = _this.dataSources.clustering.pixelRange;
            _this.dataSources.clustering.pixelRange = 0;
            _this.dataSources.clustering.pixelRange = pixelRange;
        }

        customStyle()
    }

    clickMouseLeft() {
        // 首先需要定义弹窗实例
        const dialogs = ref();
        const _this = this
        const scene = this.viewer.scene
        const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);


        //监听鼠标左击事件
        handler.setInputAction((e) => {
            // 获取点击的实体
            const pickedObject = scene.pick(e.position);
            // 判断点击的是不是点位
            if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
                const entity = pickedObject.id;
                //如果在聚合点处则不打开弹出框
                if (entity.length > 1) return

                //获取属性信息
                const desc = entity[0].properties.getValue()
                const pos = pickedObject.primitive.position
                const opts = {
                    viewer: _this.viewer, // cesium的场景
                    position: {
                        _value: pos,
                    },
                    title: desc.name, // 弹窗标题
                    content: desc.value, // 弹窗内容
                };

                if (dialogs.value) {
                    // 只允许一个弹窗出现
                    dialogs.value.windowClose();
                }
                // 实例化弹窗
                dialogs.value = new Dialog(opts);

                //开启高度监测，存在一点问题
                _this.watchCameraHeight(dialogs.value)

            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    }

    //监听选中的实体根据相机高度的变化
    watchCameraHeight(selectDialog: Dialog) {
        const viewer = this.viewer
        const HEIGHT_THRESHOLD = 1000000; // 相机高度阈值（单位：米）
        const cameraChangedListener = viewer.camera.changed.addEventListener(() => {
            const cameraHeight = viewer.camera.positionCartographic.height;

            if (cameraHeight > HEIGHT_THRESHOLD) {
                console.log('相机高度超过阈值，执行其他处理');
                selectDialog.windowClose()
                // 移除监听器（避免重复触发）
                viewer.camera.changed.removeEventListener(cameraChangedListener);
            }
        });
    }
}

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
        ctx!.font = "bold 28px Microsoft YaHei";
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