<template>
    <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', infoBox: false, shouldAnimate: true })

onMounted(() => {
    cesiumV = getCesiumViewer()
    setTimeout(() => {
        aa()
    }, 2000)
})

class WindyTemperatureImageryProvider {
    _tileWidth: number;
    _tileHeight: number;
    _tilingScheme: Cesium.WebMercatorTilingScheme;
    _maximumLevel: any;
    _ready: boolean;
    _urlTemplate: any;
    constructor(options: any) {
        this._tileWidth = 256;
        this._tileHeight = 256;
        this._tilingScheme = new Cesium.WebMercatorTilingScheme();
        this._maximumLevel = options.maximumLevel || 6;
        this._ready = true;
        this._urlTemplate = options.urlTemplate; // 瓦片地址模板
    }

    get tileWidth() { return this._tileWidth; }
    get tileHeight() { return this._tileHeight; }
    get tilingScheme() { return this._tilingScheme; }
    get maximumLevel() { return this._maximumLevel; }
    get ready() { return this._ready; }
    get rectangle() { return this._tilingScheme.rectangle; }
    get hasAlphaChannel() { return true; }

    async requestImage(x, y, level, request) {
        const url = this._urlTemplate
            .replace('{z}', level)
            .replace('{x}', x)
            .replace('{y}', y);

        const image = await loadImage(url);
        const canvas = document.createElement('canvas');
        canvas.width = this._tileWidth;
        canvas.height = this._tileHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(image, 0, 0);

        const imageData = ctx!.getImageData(0, 0, this._tileWidth, this._tileHeight);
        const pixels = imageData.data;

        // Step 1: 读取前8个像素作为 LUT（颜色到温度）
        // const lut = [];
        // for (let i = 0; i < 8; i++) {
        //     const idx = i * 4;
        //     const r = pixels[idx];
        //     const g = pixels[idx + 1];
        //     const b = pixels[idx + 2];
        //     const t = -40 + i * 10; // 假设温度范围：-40°C 到 +40°C，每步10°C
        //     lut.push({ r, g, b, t });
        // }
        const lut = [
            { r: 128, g: 17, b: 0, temp: 40 },
            { r: 129, g: 16, b: 0, temp: 35 },
            { r: 127, g: 17, b: 0, temp: 30 },
            { r: 129, g: 18, b: 1, temp: 25 },
            { r: 62, g: 159, b: 191, temp: -10 },
            { r: 65, g: 160, b: 192, temp: -20 },
            { r: 62, g: 161, b: 192, temp: -30 },
            { r: 63, g: 160, b: 192, temp: -40 },
        ]

        // Step 2: 为图像的每个像素映射温度（或替换颜色）
        for (let i = 8 * 4; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // 计算颜色对应的温度
            const t = colorToTemperature(r, g, b, lut);

            // 渲染用色：根据温度值重新着色（如蓝->红渐变）
            const color = temperatureToColor(t);
            pixels[i] = color.r;
            pixels[i + 1] = color.g;
            pixels[i + 2] = color.b;
            pixels[i + 3] = 255;
        }

        ctx?.putImageData(imageData, 0, 0);
        return canvas;
    }
}

function loadImage(url: string) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// 简单的 RGB 颜色到温度映射
function colorToTemperature(r: any, g: any, b: any, lut: any) {
    let minDist = Infinity, bestTemp = null;
    for (const entry of lut) {
        const dr = r - entry.r;
        const dg = g - entry.g;
        const db = b - entry.b;
        const dist = dr * dr + dg * dg + db * db;
        if (dist < minDist) {
            minDist = dist;
            bestTemp = entry.temp;
        }
    }
    return bestTemp;
}

// 简单温度到颜色映射（蓝-白-红渐变）
function temperatureToColor(t: any) {
    const minTemp = -40;
    const maxTemp = 40;
    const ratio = Math.max(0, Math.min(1, (t - minTemp) / (maxTemp - minTemp)));

    const r = Math.floor(255 * ratio);
    const g = Math.floor(255 * (1 - Math.abs(ratio - 0.5) * 2));
    const b = Math.floor(255 * (1 - ratio));

    return { r, g, b };
}

const aa = () => {
    const windyLayer = new WindyTemperatureImageryProvider({
        urlTemplate: 'https://ims.windy.com/im/v3.0/forecast/ecmwf-hres/2025080400/2025080412/wm_grid_257/{z}/{x}/{y}/temp-surface.jpg',
        maximumLevel: 6
    });

    cesiumV.imageryLayers.addImageryProvider(windyLayer);
}
</script>

<style scoped>
#cesiumContainer {
    height: 100vh;
}
</style>