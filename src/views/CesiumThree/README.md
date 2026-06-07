# Cesium 中加载 GeoJSON 数据的学习文档

> 本文档介绍在 Cesium 中加载和处理 GeoJSON 数据的三种主要方式，包括原理、适用场景和代码示例。

## 目录

- [概述](#概述)
- [文件结构](#文件结构)
- [工具函数模块 (utils.ts)](#工具函数模块-utilsts)
- [方式一：Entities 实体直接加载](#方式一entities-实体直接加载)
- [方式二：Rectangle 实体 + Canvas](#方式二rectangle-实体--canvas)
- [方式三：影像图层 + Canvas](#方式三影像图层--canvas)
- [三种方式对比](#三种方式对比)
- [扩展阅读](#扩展阅读)

---

## 概述

GeoJSON 是一种用于编码地理数据的格式，广泛用于 WebGIS 开发。在 Cesium 中加载 GeoJSON 数据有多种方式，各有优劣：

| 特性 | Entities 实体 | Rectangle + Canvas | 影像图层 |
|------|--------------|-------------------|---------|
| 贴合地形 | ❌ | ❌ | ✅ |
| 性能 | 中等 | 高 | 高 |
| 交互性 | ✅ 高 | ❌ 低 | ❌ 低 |
| 动画支持 | ❌ | ✅ | ✅ |
| 实现复杂度 | 简单 | 中等 | 中等 |

---

## 文件结构

```
src/views/cesiumThree/
├── index.vue      # 主组件，三种加载方式的实现
├── utils.ts       # 工具函数模块
└── README.md      # 学习文档
```

---

## 工具函数模块 (utils.ts)

工具函数按功能分类，便于复用和维护。

### 类型定义

```typescript
// 地理范围类型
interface GeoBounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

// Canvas 热力图绘制配置
interface HeatmapOptions {
  width?: number;    // Canvas 宽度，默认 1024
  height?: number;   // Canvas 高度，默认 1024
  blur?: number;     // 高斯模糊半径，默认 8
  maxValue?: number; // 归一化最大值，默认 15
}
```

### 数据加载

```typescript
// 加载 GeoJSON 数据
fetchGeoJson(url?: string): Promise<any>
```

### 颜色映射

```typescript
// Log 归一化
normalize(val: number): number

// 获取 Cesium Color（用于 Entity）
getColorForEntity(val: number, maxValue?: number): Cesium.Color

// 获取 CSS HSLA 颜色（用于 Canvas）
getColorForCanvas(val: number, maxValue?: number): string
```

### 数据处理

```typescript
// 按 Hour 属性分组
buildHourMap(geojson: any): Map<number, any[]>

// 计算地理范围
computeBounds(geojson: any, bounds?: GeoBounds): GeoBounds

// 获取范围中心点
getBoundsCenter(bounds: GeoBounds): [number, number]

// 创建空范围
createEmptyBounds(): GeoBounds

// 重置范围
resetBounds(bounds: GeoBounds): void
```

### Canvas 绘制

```typescript
// 经纬度转 Canvas 坐标
projectToCanvas(lon, lat, width, height, bounds): [number, number]

// 绘制热力图到 Canvas
drawHeatmapOnCanvas(features, bounds, options?): HTMLCanvasElement

// 预计算所有时间点的 Canvas
precomputeCanvas(hourMap, bounds, options?): Promise<Map<number, HTMLCanvasElement>>
```

### Cesium 辅助

```typescript
// 创建 Rectangle
createRectangle(bounds: GeoBounds): Cesium.Rectangle

// 创建飞行目标位置
createFlyToPosition(bounds: GeoBounds, height?: number): Cesium.Cartesian3

// 创建 SingleTileImageryProvider
createSingleTileProvider(canvas: HTMLCanvasElement, bounds: GeoBounds): Cesium.SingleTileImageryProvider
```

### 使用示例

```typescript
import {
  fetchGeoJson,
  buildHourMap,
  computeBounds,
  precomputeCanvas,
  createRectangle,
  createFlyToPosition,
} from "./utils";

const geojson = await fetchGeoJson();
const hourMap = buildHourMap(geojson);
const bounds = computeBounds(geojson);
const canvasCache = await precomputeCanvas(hourMap, bounds);

// 飞到目标位置
viewer.camera.flyTo({
  destination: createFlyToPosition(bounds),
  duration: 2,
});
```

---

## 方式一：Entities 实体直接加载

### 原理

使用 `Viewer.entities.add()` 方法，将 GeoJSON 中的每个多边形作为一个独立的 Entity 添加到场景中。

### 代码示例

```typescript
const loadByEntities = async () => {
  const geojson = await fetchGeoJson();
  
  geojson.features.forEach((f) => {
    cesiumV.entities.add({
      polygon: {
        // 将坐标数组转换为 Cartesian3
        hierarchy: Cesium.Cartesian3.fromDegreesArray(
          f.geometry.coordinates[0].flat()
        ),
        // 设置材质颜色
        material: getColorForEntity(f.properties.Conc),
        perPositionHeight: false,
      },
    });
  });
};
```

### 适用场景

- ✅ 需要点击选中单个要素
- ✅ 需要为每个多边形设置不同的属性
- ✅ 数据量较小（< 1000 个要素）
- ✅ 快速原型开发

### 注意事项

- 多边形不会贴合地形，悬浮在地球表面
- 大量实体会影响性能
- 使用 `entities.removeAll()` 清除

---

## 方式二：Rectangle 实体 + Canvas

### 原理

1. 将 GeoJSON 数据按时间分组
2. 在 Canvas 上绘制热力图
3. 将 Canvas 作为材质贴到 Rectangle 实体上
4. 通过切换 Canvas 实现动画效果

### 代码示例

```typescript
const loadByRectangle = async () => {
  // 1. 按 Hour 属性分组
  buildHourMap(geojson, hourMap);
  
  // 2. 计算整体地理范围
  computeBounds(geojson, bounds);
  
  // 3. 预计算所有时间点的 Canvas
  await precomputeCanvas(hourMap, canvasCache, bounds);
  
  // 4. 创建 Rectangle 实体
  rectangleEntity = cesiumV.entities.add({
    rectangle: {
      coordinates: Cesium.Rectangle.fromDegrees(
        bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat
      ),
      material: new Cesium.ImageMaterialProperty({
        image: canvasCache.get(currentHour),
        transparent: true,
      }),
    },
  });
};

// 更新动画帧
const updateRectangleCanvas = (hour: number) => {
  (rectangleEntity.rectangle!.material as Cesium.ImageMaterialProperty).image = 
    canvasCache.get(hour);
};
```

### Canvas 绘制核心代码

```typescript
const drawHeatmapOnCanvas = (features, width, height, bounds) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  features.forEach((f) => {
    const coords = f.geometry.coordinates[0];
    
    ctx.beginPath();
    coords.forEach(([lon, lat], i) => {
      const [x, y] = projectToCanvas(lon, lat, width, height, bounds);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    
    ctx.fillStyle = getColorForCanvas(f.properties.Conc);
    ctx.filter = "blur(8px)"; // 高斯模糊
    ctx.fill();
  });

  return canvas;
};
```

### 适用场景

- ✅ 需要时间序列动画
- ✅ 需要热力图效果
- ✅ 数据量大但不需要交互
- ❌ 不需要贴合地形

### 注意事项

- 预计算时使用 `setTimeout(0)` 让出主线程
- Canvas 尺寸建议 1024x1024 或 2048x2048
- 使用 `entities.removeAll()` 清除

---

## 方式三：影像图层 + Canvas

### 原理

1. 同样在 Canvas 上绘制热力图
2. 使用 `SingleTileImageryProvider` 将 Canvas 转为影像提供者
3. 添加为 `ImageryLayer`，自动贴合地形
4. 每个时间点一个图层，通过 `show` 属性切换

### 代码示例

```typescript
const loadByImageryLayer = async () => {
  // 1. 分组和计算范围（同方式二）
  buildHourMap(geojson, hourMap);
  computeBounds(geojson, bounds);
  await precomputeCanvas(hourMap, canvasCache, bounds);

  // 2. 创建影像图层
  canvasCache.forEach((canvas, hour) => {
    const imageryProvider = new Cesium.SingleTileImageryProvider({
      url: canvas.toDataURL(),
      rectangle: Cesium.Rectangle.fromDegrees(
        bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat
      ),
      tileWidth: 256,
      tileHeight: 256,
    });

    const layer = cesiumV.imageryLayers.addImageryProvider(imageryProvider);
    layer.show = false; // 默认隐藏
    layerMap.set(hour, layer);
  });

  // 3. 显示第一个时间点
  showImageryLayer(currentHour);
};

// 切换显示的图层
const showImageryLayer = (hour: number) => {
  if (currentLayer) currentLayer.show = false;
  currentLayer = layerMap.get(hour);
  if (currentLayer) currentLayer.show = true;
};
```

### 适用场景

- ✅ 需要贴合地形
- ✅ 需要时间序列动画
- ✅ 大数据量场景
- ❌ 不需要交互选中

### 注意事项

- `SingleTileImageryProvider` 适合小范围数据
- 大范围数据考虑使用 `UrlTemplateImageryProvider` 切片
- 使用 `imageryLayers.remove(layer)` 清除单个图层
- 使用 `imageryLayers.removeAll()` 清除所有影像图层

---

## 三种方式对比

### 性能对比

| 数据量 | Entities | Rectangle + Canvas | 影像图层 |
|-------|----------|-------------------|---------|
| 100 个多边形 | 流畅 | 流畅 | 流畅 |
| 1000 个多边形 | 轻微卡顿 | 流畅 | 流畅 |
| 10000 个多边形 | 卡顿明显 | 流畅 | 流畅 |
| 动画帧率 | N/A | 60fps | 60fps |

### 地形贴合效果

```
Entities:        多边形悬浮在地球表面（有缝隙）
                 ┌─────────────┐
                 │  Polygon    │ ← 悬浮
                 └─────────────┘
              ～～～ 地形表面 ～～～

Rectangle:       同上，不贴合地形

ImageryLayer:    完美贴合地形
                 ████ 叠加在地形上 ████
              ～～～ 地形表面 ～～～
```

---

## 扩展阅读

### 待扩展内容

- [ ] 方式四：使用 GeoJsonDataSource 加载
- [ ] 方式五：使用 Primitive 优化性能
- [ ] 方式六：3D Tiles 矢量切片
- [ ] 点、线要素的处理方式
- [ ] GeoJSON 样式配置（按属性着色）
- [ ] 点击拾取与信息弹窗
- [ ] 大规模数据优化策略

### 相关 API 文档

- [Cesium.Entity](https://cesium.com/learn/cesiumjs/ref-doc/Entity.html)
- [Cesium.Rectangle](https://cesium.com/learn/cesiumjs/ref-doc/RectangleGraphics.html)
- [Cesium.ImageryLayer](https://cesium.com/learn/cesiumjs/ref-doc/ImageryLayer.html)
- [Cesium.SingleTileImageryProvider](https://cesium.com/learn/cesiumjs/ref-doc/SingleTileImageryProvider.html)

---

## 更新日志

| 日期 | 内容 |
|------|------|
| 2025-10-30 | 初始版本，实现三种加载方式 |
| 2025-10-30 | 抽离工具函数到 utils.ts，优化代码结构 |

---

## 参考资料

- [CesiumJS 官方文档](https://cesium.com/learn/cesiumjs/)
- [GeoJSON 规范](https://geojson.org/)
- [Turf.js 空间分析库](https://turfjs.org/)
