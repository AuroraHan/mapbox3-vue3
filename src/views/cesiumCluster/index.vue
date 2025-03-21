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
import { randomGeoJsonPoint } from './tools'
import { FeatureCollection } from 'geojson';

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer' })


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
    const mock = randomGeoJsonPoint(100, 130, 20, 40, 10000)
    // const data = Cesium.GeoJsonDataSource.load(mock, {
    //     stroke: Cesium.Color.HOTPINK,
    //     markerSize: 5,
    // }).then((data) => {
    //     cesiumV.dataSources.add(data)
    // })

    const aa = new Cluster({ viewer: cesiumV })
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

    showCluster(geoJsonDataSource) {
        const _this = this

        this.dataSources = geoJsonDataSource
        this.dataSources.clustering.enabled = true;
        this.dataSources.clustering.pixelRange = 3;
        this.dataSources.clustering.minimumClusterSize = 1;
        this.viewer.dataSources.add(this.dataSources!);

        let removeListener;

        function customStyle() {

            if (Cesium.defined(removeListener)) {
                removeListener();
                removeListener = undefined;
            } else {
                removeListener = _this.dataSources.clustering.clusterEvent.addEventListener(async (clusteredEntities, cluster) => {
                    // console.log(clusteredEntities, cluster);
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
                        //   cluster.billboard.image = this_.drawImage(
                        //     clusteredEntities.length,
                        //     _this.colorArr[xx].size,
                        //     _this.colorArr[xx].color
                        //   );
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