<template>
    <div id="cesiumContainer">
        <div class="options">
            <button @click="addModel">添加模型</button>
            <button @click="play1">播放动画</button>
            <button @click="pause">暂停动画</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '@/hooks/useCesium'
import * as turf from '@turf/turf';


let cesiumV: Cesium.Viewer;

const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', addTerrain: false, infoBox: false, shouldAnimate: true })
onMounted(() => {
    cesiumV = getCesiumViewer()

    createCanvas()
})



//geojson数据加载
const loadGeoJson = async () => {
    // 加载 GeoJSON
    const res = await fetch("/geojson/dep-conc-time.geojson");
    const geojson = await res.json();
    renderPolygons(geojson.features);
    cesiumV.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(122.48450369499642, 36.982489271601295, 10000),
        duration: 2
    })
}

const renderPolygons = (features: any) => {
    features.forEach(f => {
        cesiumV.entities.add({
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray(f.geometry.coordinates[0].flat()),
                material: getColor(f.properties.Conc),
                perPositionHeight: false
            }
        });
    });
}


// ===== log归一化 =====
const normalize = (val: number) => {
    return Math.log10(val);
}

// =====  颜色映射 =====
const getColor = (val: number) => {
    const v = normalize(val);

    const ratio = Math.min(v / 15, 1.0);

    return Cesium.Color.fromHsl(
        (1.0 - ratio) * 0.7,
        1.0,
        0.5,
        0.6
    );
}


//-------------------
const currentHour = ref(1);

let timer: any = null;
let rectangleEntity: Cesium.Entity | null = null;

// 数据
const hourMap = new Map<number, any[]>();
const canvasCache = new Map<number, HTMLCanvasElement>();

// 地理范围（初始化计算）
let minLon = Infinity, maxLon = -Infinity;
let minLat = Infinity, maxLat = -Infinity;

async function precomputeAll() {
    for (const hour of hourMap.keys()) {
        drawHeatmap(hour);

        // 👉 防止主线程卡死（非常关键）
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    console.log("✅ 热力图缓存完成");
}

const createCanvas = async () => {
    const res = await fetch("/geojson/dep-conc-time.geojson");
    const geojson = await res.json();

    buildHourMap(geojson);
    computeBounds(geojson);

    // 👇 在 buildHourMap 之后调用
    await precomputeAll();

    // 初始化底图承载
    rectangleEntity = cesiumV.entities.add({
        rectangle: {
            coordinates: Cesium.Rectangle.fromDegrees(
                minLon, minLat, maxLon, maxLat
            ),
            material: new Cesium.ImageMaterialProperty({
                image: drawHeatmap(currentHour.value),
                transparent: true
            })
        }
    });

    cesiumV.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            (minLon + maxLon) / 2,
            (minLat + maxLat) / 2,
            2000000
        ),
    });
}

// ===== 1. 按 Hour 分组 =====
function buildHourMap(geojson: any) {
    geojson.features.forEach((f: any) => {
        const hour = f.properties.Hour;

        if (!hourMap.has(hour)) {
            hourMap.set(hour, []);
        }

        hourMap.get(hour)!.push(f);
    });
}

// ===== 2. 计算范围 =====
function computeBounds(geojson: any) {
    geojson.features.forEach((f: any) => {
        const coords = f.geometry.coordinates[0];

        coords.forEach(([lon, lat]: number[]) => {
            minLon = Math.min(minLon, lon);
            maxLon = Math.max(maxLon, lon);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
        });
    });
}



// ===== 4. 颜色映射 =====
function getColor1(val: number) {
    const v = normalize(val);
    const ratio = Math.min(v / 15, 1.0);

    // 蓝 → 红
    const h = (1.0 - ratio) * 240;

    return `hsla(${h}, 100%, 50%, 0.6)`;
}


// ===== 5. 坐标转Canvas =====
function project(lon: number, lat: number, width: number, height: number) {
    const x = ((lon - minLon) / (maxLon - minLon)) * width;
    const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
    return [x, y];
}


// ===== 6. 核心：绘制热力图 =====
function drawHeatmap(hour: number) {
    if (canvasCache.has(hour)) {
        return canvasCache.get(hour)!;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;

    const ctx = canvas.getContext("2d")!;
    const features = hourMap.get(hour)!;

    features.forEach((f: any) => {
        const coords = f.geometry.coordinates[0];
        const conc = f.properties.Conc;

        if (!conc) return;

        ctx.beginPath();

        coords.forEach(([lon, lat]: number[], i: number) => {
            const [x, y] = project(lon, lat, canvas.width, canvas.height);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.closePath();

        ctx.fillStyle = getColor1(conc);
        //高斯模糊（更像热力图）
        ctx.filter = "blur(8px)";
        ctx.fill();
    });

    canvasCache.set(hour, canvas);
    return canvas;
}


// ===== 7. 渲染某一小时 =====
function renderHour(hour: number) {
    if (!rectangleEntity) return;

    const canvas = canvasCache.get(hour);

    if (!canvas) return;

    (rectangleEntity.rectangle!.material as any).image = canvas;
}

// ===== 8. 播放 =====
function play1() {
    if (timer) return;

    timer = setInterval(() => {
        currentHour.value++;

        if (currentHour.value > 5) {
            currentHour.value = 1;
        }

        renderHour(currentHour.value);
    }, 800);
}

function stop() {
    clearInterval(timer);
    timer = null;
}
</script>

<style scoped>
#cesiumContainer {
    height: 100vh;
    position: relative;
}

.options {
    position: absolute;
    left: 3%;
    top: 3%;
    width: 100px;
    height: 50px;
    z-index: 99;
}
</style>