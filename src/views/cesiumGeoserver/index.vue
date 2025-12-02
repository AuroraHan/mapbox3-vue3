<!--  -->
<template>
    <div id="cesiumContainer"></div>
    <div class="aaa" @click="onClick">{{ position.longitude }}</div>
</template>

<script setup lang='ts'>
import { onMounted, ref, computed } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { CesiumEvent } from '@/utils/cesiumEvent'
import { useCesiumEventStore } from '@/stores/cesiumStore'

const cesiumEventStore = useCesiumEventStore();
const position = computed(() => cesiumEventStore.mouseMovePostion);
const bounds = computed(() => cesiumEventStore.bounds);

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', infoBox: false, shouldAnimate: true })

onMounted(() => {
    cesiumV = getCesiumViewer()
    // wmsServer()
    temServer()
})

//
const wmsServer = () => {
    const wmsLayer = cesiumV.imageryLayers.addImageryProvider(
        new Cesium.WebMapServiceImageryProvider({
            url: 'geoserverApi/geoserver/gxh/wms',
            layers: 'gxh:wind-mercator',
            parameters: {
                service: 'WMS',
                format: 'image/png',
                transparent: true,
                version: '1.1.0'
                // 如果你在 GeoServer 已设置插值失败，这里就不依赖它了
                // INTERPOLATION: 'BILINEAR'
            }
        })
    );
}

class CustomTmsImageryProvider {
    _url: any;
    _tileWidth: any;
    _tileHeight: any;
    _minimumLevel: any;
    _maximumLevel: any;
    _credit: Cesium.Credit | undefined;
    _tilingScheme: Cesium.WebMercatorTilingScheme;
    _isTms: boolean;
    _processTile: any;
    _rectangle: any;
    _errorEvent: Cesium.Event<(...args: any[]) => void>;
    _ready: boolean;
    constructor(options: any) {
        if (!options || !options.url) {
            throw new Error("必须提供 url");
        }

        this._url = options.url;
        this._tileWidth = options.tileWidth || 256;
        this._tileHeight = options.tileHeight || 256;
        this._minimumLevel = options.minimumLevel || 0;
        this._maximumLevel = options.maximumLevel ?? 18;
        this._credit = options.credit ? new Cesium.Credit(options.credit) : undefined;

        // 固定为 WebMercator
        this._tilingScheme = new Cesium.WebMercatorTilingScheme();

        // GeoServer TMS → 左下角原点，需要翻转 Y
        this._isTms = false;

        this._rectangle = this._tilingScheme.rectangle;
        this._errorEvent = new Cesium.Event();
        this._ready = true;
    }

    // ---- Cesium 要求的 getter ----
    get ready() { return this._ready; }
    get tileWidth() { return this._tileWidth; }
    get tileHeight() { return this._tileHeight; }
    get minimumLevel() { return this._minimumLevel; }
    get maximumLevel() { return this._maximumLevel; }
    get tilingScheme() { return this._tilingScheme; }
    get rectangle() { return this._rectangle; }
    get errorEvent() { return this._errorEvent; }
    get credit() { return this._credit; }
    get hasAlphaChannel() { return true; }

    // ---- 构造 URL ----
    _buildUrl(x: number, y: number, level: number) {
        const yTiles = this._tilingScheme.getNumberOfYTilesAtLevel(level);
        const tmsY = this._isTms
            ? (yTiles - 1 - y)  // 翻转
            : y;     // TMS 左下原点 → 翻转
        return this._url
            .replace(/\{z\}/gi, level)
            .replace(/\{x\}/gi, x)
            .replace(/\{y\}/gi, tmsY);
    }

    // ---- 核心：请求并处理瓦片 ----
    requestImage(x: number, y: number, level: number) {
        const url = this._buildUrl(x, y, level);

        return Cesium.ImageryProvider.loadImage(this, url)?.then((image) => {
            const canvas = document.createElement("canvas");
            canvas.width = this._tileWidth;
            canvas.height = this._tileHeight;
            const ctx = canvas.getContext("2d");

            ctx?.drawImage(image, 0, 0);

            return canvas;
        }).catch((err) => {
            this._errorEvent.raiseEvent(this, err);
            return undefined;
        });
    }
}

// const aa = new CustomTmsImageryProvider({
//     url: 'geoserverApi/geoserver/gwc/service/tms/1.0.0/gxh%3Awind-mercator@EPSG%3A900913@png/{x}/{y}/{z}.png',
//     // url: "geoserverApi/geoserver/gxh/gwc/service/wmts?layer=gxh%3Awind-mercator&style=&tilematrixset=EPSG%3A900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix=EPSG%3A900913:{z}&TileCol={x}&TileRow={y}",
//     maximumLevel: 18,
// })

// cesiumV.imageryLayers.addImageryProvider(aa)
const temServer = () => {
    const customProvider = new CustomTmsProviderB({
        // url: 'geoserverApi/geoserver/gwc/service/tms/1.0.0/gxh%3Awind-mercator@EPSG%3A900913@png/{z}/{x}/{reverseY}.png',
        url: "geoserverApi/geoserver/gxh/gwc/service/wmts?layer=gxh%3Awind-mercator&style=&tilematrixset=EPSG%3A900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix=EPSG%3A900913:{z}&TileCol={x}&TileRow={reverseY}",
        // parameters: {
        //     srs: "EPSG:900913",
        //     // format: "application/openlayers",
        //     format: "png", //指定文件拓展名为png
        //     transparent: true,
        // }
    });
    cesiumV.imageryLayers.addImageryProvider(customProvider)
}

class CustomTmsProviderB extends Cesium.UrlTemplateImageryProvider {
    requestImage(x: number, y: number, level: number, request?: Cesium.Request): Promise<Cesium.ImageryTypes> | undefined {
        return super.requestImage(x, y, level)?.then(image => {
            const tileSize = 256; // 一般是256
            // 这里对图片做处理
            const canvas = document.createElement('canvas');
            canvas.width = tileSize;
            canvas.height = tileSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, tileSize, tileSize);

            const imgData = ctx.getImageData(0, 0, tileSize, tileSize);
            // const data = imgData.data;
            // for (let i = 0; i < data.length; i += 4) {
            //     const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            //     data[i] = data[i + 1] = data[i + 2] = gray;
            // }
            ctx.putImageData(imgData, 0, 0);
            return canvas;
        });
    }
}
</script>
<style scoped lang='scss'>
#cesiumContainer {
    height: 100vh;
}

.aaa {
    position: absolute;
    left: 2%;
    top: 2%;
    width: 100px;
    height: 100px;
    background-color: aquamarine;
}
</style>