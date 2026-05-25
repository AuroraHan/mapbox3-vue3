<template>
  <div id="cesiumContainer">
    <div class="my-btn" @click="loadThirdPartyParticles"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import * as Cesium from "cesium";
import { WindData, WindLayer } from "cesium-wind-layer";
import { useCesium } from "@/hooks/useCesium";

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({
  container: "cesiumContainer",
  infoBox: false,
  shouldAnimate: true,
});

onMounted(() => {
  cesiumV = getCesiumViewer();
  // setTimeout(() => {
  //     aa()
  // }, 2000)
});

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

  get tileWidth() {
    return this._tileWidth;
  }
  get tileHeight() {
    return this._tileHeight;
  }
  get tilingScheme() {
    return this._tilingScheme;
  }
  get maximumLevel() {
    return this._maximumLevel;
  }
  get ready() {
    return this._ready;
  }
  get rectangle() {
    return this._tilingScheme.rectangle;
  }
  get hasAlphaChannel() {
    return true;
  }

  async requestImage(x, y, level, request) {
    const url = this._urlTemplate
      .replace("{z}", level)
      .replace("{x}", x)
      .replace("{y}", y);

    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = this._tileWidth;
    canvas.height = this._tileHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(image, 0, 0);

    const imageData = ctx!.getImageData(
      0,
      0,
      this._tileWidth,
      this._tileHeight,
    );
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
    ];

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
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// 简单的 RGB 颜色到温度映射
function colorToTemperature(r: any, g: any, b: any, lut: any) {
  let minDist = Infinity,
    bestTemp = null;
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
    urlTemplate:
      "https://ims.windy.com/im/v3.0/forecast/ecmwf-hres/2025080400/2025080412/wm_grid_257/{z}/{x}/{y}/temp-surface.jpg",
    maximumLevel: 6,
  });

  cesiumV.imageryLayers.addImageryProvider(windyLayer);
};
//----------------------
//粒子风场
const windData = {
  header: {
    nx: 360,
    ny: 181,
    lo1: -180,
    la1: 90,
    dx: 1,
    dy: 1,
  },
  data: new Array(360 * 181).fill(0).map(() => ({
    u: (Math.random() - 0.5) * 2,
    v: (Math.random() - 0.5) * 2,
  })),
};

class WindField {
  nx: any;
  ny: any;
  lo1: any;
  la1: any;
  dx: any;
  dy: any;
  data: any;
  constructor(data: any) {
    this.nx = data.header.nx;
    this.ny = data.header.ny;
    this.lo1 = data.header.lo1;
    this.la1 = data.header.la1;
    this.dx = data.header.dx;
    this.dy = data.header.dy;
    this.data = data.data;
  }

  getVelocity(lon: number, lat: number) {
    const i = Math.floor((lon - this.lo1) / this.dx);
    const j = Math.floor((this.la1 - lat) / this.dy);

    const index = j * this.nx + i;
    return this.data[index] || { u: 0, v: 0 };
  }
}

// =========================
// 粒子系统
// =========================
class WindParticleSystem {
  viewer: Cesium.Viewer;
  windField: WindField;
  particles: never[];
  billboards: any;
  constructor(viewer: Cesium.Viewer, windField: WindField) {
    this.viewer = viewer;
    this.windField = windField;
    this.particles = [];

    this.billboards = viewer.scene.primitives.add(
      new Cesium.BillboardCollection(),
    );
  }

  randomParticle() {
    return {
      lon: Math.random() * 360 - 180,
      lat: Math.random() * 180 - 90,
      age: 0,
    };
  }

  addParticle() {
    const p = this.randomParticle();

    p.billboard = this.billboards.add({
      position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat),
      image: "https://unpkg.com/ionicons@5.5.2/dist/svg/ellipse.svg",
      scale: 0.1,
    });

    this.particles.push(p);
  }

  update() {
    this.particles.forEach((p: any) => {
      const vel = this.windField.getVelocity(p.lon, p.lat);

      p.lon += vel.u * 0.05;
      p.lat += vel.v * 0.05;

      if (p.lon > 180) p.lon = -180;
      if (p.lon < -180) p.lon = 180;

      if (p.lat > 90) p.lat = -90;
      if (p.lat < -90) p.lat = 90;

      p.billboard.position = Cesium.Cartesian3.fromDegrees(p.lon, p.lat);

      p.age++;
      if (p.age > 120) {
        p.lon = Math.random() * 360 - 180;
        p.lat = Math.random() * 180 - 90;
        p.age = 0;
      }
    });
  }
}

const bb = () => {
  const windField = new WindField(windData);
  const system = new WindParticleSystem(cesiumV, windField);

  // 初始化粒子
  for (let i = 0; i < 3000; i++) {
    system.addParticle();
  }

  // 动画循环
  cesiumV.scene.preRender.addEventListener(() => {
    system.update();
  });
};

//============第三方插件加载粒子=============
const loadThirdPartyParticles = async () => {
  try {
    const res = await fetch("/winds/wind-cesium.json");
    const data = await res.json();
    const windData: WindData = {
      ...data,
      bounds: {
        west: data.bbox[0],
        south: data.bbox[1],
        east: data.bbox[2],
        north: data.bbox[3],
      },
    }; // 使用配置创建风场图层
    const windLayer = new WindLayer(cesiumV, windData, {
      particlesTextureSize: 100, // 粒子系统的纹理大小
      particleHeight: 1000, // 粒子距地面高度
      lineWidth: { min: 1, max: 2 }, // 粒子轨迹宽度范围
      lineLength: { min: 20, max: 100 }, // 粒子轨迹长度范围
      speedFactor: 1.0, // 速度倍数
      dropRate: 0.003, // 粒子消失率
      dropRateBump: 0.001, // 慢速粒子的额外消失率
      colors: ["white", "blue", "red"], // 粒子颜色
      flipY: false, // 是否翻转 Y 坐标
      domain: undefined, // 速度渲染范围
      displayRange: undefined, // 速度显示范围
      dynamic: true, // 是否启用动态粒子动画
    });
  } catch (error) {}
};
</script>

<style scoped>
#cesiumContainer {
  height: 100vh;
}

.my-btn {
  width: 100px;
  height: 60px;
  position: absolute;
  background-color: aquamarine;
  left: 3%;
  top: 5%;
  z-index: 99;
}
</style>
