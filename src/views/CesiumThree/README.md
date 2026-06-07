# Cesium 中加载 GeoJSON 数据的学习文档

> 本文档介绍在 Cesium 中加载和处理 GeoJSON 数据的四种主要方式，包括原理、适用场景和代码示例。

## 目录

- [概述](#概述)
- [文件结构](#文件结构)
- [工具函数模块 (utils.ts)](#工具函数模块-utilsts)
- [方式一：Entities 实体直接加载](#方式一entities-实体直接加载)
- [方式二：GeoJsonDataSource 加载](#方式二geojsondatasource-加载)
- [方式三：Rectangle 实体 + Canvas](#方式三rectangle-实体--canvas)
- [方式四：影像图层 + Canvas](#方式四影像图层--canvas)
- [方式五：Primitive 性能优化](#方式五primitive-性能优化)
- [五种方式对比](#五种方式对比)
- [选择决策树](#选择决策树)
- [扩展阅读](#扩展阅读)

---

## 概述

GeoJSON 是一种用于编码地理数据的格式，广泛用于 WebGIS 开发。在 Cesium 中加载 GeoJSON 数据有多种方式，各有优劣：

| 特性 | Entities 实体 | GeoJsonDataSource | Rectangle + Canvas | 影像图层 | Primitive |
|------|--------------|-------------------|-------------------|---------|-----------|
| 贴合地形 | ❌ | ✅ (clampToGround) | ❌ | ✅ | ✅ (GroundPrimitive) |
| 性能 | 中等 | 较好 | 高 | 高 | **最高** |
| 交互性 | ✅ 高 | ✅ 高 | ❌ 低 | ❌ 低 | ⚠️ 需手动实现 |
| 动画支持 | ❌ | ❌ | ✅ | ✅ | ⚠️ 需手动实现 |
| 实现复杂度 | 简单 | 最简单 | 中等 | 中等 | 复杂 |
| 样式灵活性 | 高 | 中等 | 高 | 高 | **最高** |
| 内存占用 | 较高 | 较高 | 低 | 低 | **最低** |

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

## 方式二：GeoJsonDataSource 加载

### 原理

`GeoJsonDataSource` 是 Cesium 提供的内置数据源类，专门用于加载和解析 GeoJSON 数据。它会自动将 GeoJSON 中的要素转换为 Entity，并支持样式配置和地形贴合。

### 代码示例

#### 基础加载

```typescript
const loadByGeoJsonDataSource = async () => {
  const dataSource = await Cesium.GeoJsonDataSource.load(
    "/geojson/dep-conc-time.geojson",
    {
      stroke: Cesium.Color.BLACK,
      strokeWidth: 1,
      fill: Cesium.Color.YELLOW.withAlpha(0.6),
      clampToGround: true,  // 关键：贴合地形
    }
  );

  viewer.dataSources.add(dataSource);

  // 飞到数据范围
  viewer.flyTo(dataSource);
};
```

#### 按属性动态着色

```typescript
const loadWithDynamicStyle = async () => {
  const dataSource = await Cesium.GeoJsonDataSource.load(url);

  // 遍历所有 Entity，按属性设置颜色
  const entities = dataSource.entities.values;
  entities.forEach((entity) => {
    const conc = entity.properties?.Conc?.getValue();
    if (entity.polygon) {
      entity.polygon.material = getColorForEntity(conc);
    }
  });

  viewer.dataSources.add(dataSource);
};
```

#### 加载选项详解

```typescript
const options = {
  // 描边样式
  stroke: Cesium.Color.BLACK,           // 描边颜色
  strokeWidth: 2,                        // 描边宽度

  // 填充样式
  fill: Cesium.Color.BLUE.withAlpha(0.5), // 填充颜色

  // 点样式
  markerSymbol: '?',                     // 点标记符号
  markerSize: 48,                        // 点标记大小
  markerColor: Cesium.Color.RED,         // 点标记颜色

  // 地形贴合
  clampToGround: true,                   // 贴合地形

  // 源配置
  sourceUri: 'custom-name',              // 数据源标识
};
```

### API 方法

```typescript
// 静态方法：从 URL 加载
Cesium.GeoJsonDataSource.load(url, options): Promise<GeoJsonDataSource>

// 静态方法：从 JSON 对象加载
Cesium.GeoJsonDataSource.load(geojson, options): Promise<GeoJsonDataSource>

// 实例方法：添加 Entity
dataSource.entities.add(entity)

// 实例方法：获取所有 Entity
dataSource.entities.values: Entity[]

// 显示/隐藏
dataSource.show = true/false

// 移除数据源
viewer.dataSources.remove(dataSource, destroy: boolean)
```

### 适用场景

- ✅ 快速加载标准 GeoJSON（最简单的方式）
- ✅ 需要点击交互选中单个要素
- ✅ 需要贴合地形（设置 `clampToGround: true`）
- ✅ 需要统一配置样式
- ✅ 支持 Point、LineString、Polygon 等多种几何类型

### 注意事项

- 自动解析所有 GeoJSON 几何类型
- 每个 Feature 自动转为 Entity，可通过 `dataSource.entities.values` 访问
- 使用 `viewer.dataSources.remove(dataSource, true)` 清除
- 大数据量时 Entity 数量多，性能不如影像图层
- 不直接支持时间序列动画，需要额外处理

### 与方式一的区别

| 对比项 | Entities 手动添加 | GeoJsonDataSource |
|--------|------------------|-------------------|
| 代码量 | 多，需手动解析 | 少，一行代码搞定 |
| 坐标转换 | 手动 `fromDegreesArray` | 自动处理 |
| 地形贴合 | ❌ 不支持 | ✅ `clampToGround` |
| 样式控制 | 完全自定义 | 通过 options 配置 |
| 适用场景 | 需要精细控制 | 快速加载标准数据 |

---

## 方式三：Rectangle 实体 + Canvas

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

## 方式四：影像图层 + Canvas

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

## 方式五：Primitive 性能优化

### 原理

`Primitive` 是 Cesium 中更底层的渲染 API。Entity 是高级抽象，内部会转换为 Primitive 再渲染。直接使用 Primitive 可以跳过中间层，获得更高的性能和更灵活的渲染控制。

```
渲染层级：
┌─────────────────────────────────────────────────┐
│  高级抽象（简单但性能一般）                        │
│  ┌─────────────────────────────────────────┐    │
│  │  Entity / DataSource                     │    │
│  └─────────────────────────────────────────┘    │
│              ↓ 内部转换                          │
│  ┌─────────────────────────────────────────┐    │
│  │  Primitive                               │    │
│  └─────────────────────────────────────────┘    │
│              ↓ 底层渲染                          │
│  ┌─────────────────────────────────────────┐    │
│  │  WebGL / GPU                             │    │
│  └─────────────────────────────────────────┘    │
│  底层抽象（复杂但性能最优）                        │
└─────────────────────────────────────────────────┘
```

### 性能差异原理

```typescript
// Entity 方式：每个多边形 = 1 次 draw call
features.forEach(f => {
  viewer.entities.add({ polygon: {...} });
});
// 10000 个多边形 = 10000 次 draw call → 性能问题

// Primitive 方式：所有多边形合并 = 1 次 draw call
const instances = features.map(f => new GeometryInstance({...}));
const primitive = new Primitive({ geometryInstances: instances });
// 10000 个多边形 = 1 次 draw call → 高性能
```

### 代码示例

#### 1. 基础用法：批量渲染多边形

```typescript
/**
 * 使用 Primitive 批量渲染多边形
 * 特点：高性能，适合大数据量场景
 */
const loadByPrimitive = async () => {
  const geojson = await fetchGeoJson();

  // 1. 创建 GeometryInstance 数组
  const instances: Cesium.GeometryInstance[] = [];

  geojson.features.forEach((f: any) => {
    const coords = f.geometry.coordinates[0];

    // 将坐标转换为 Cartesian3
    const positions = Cesium.Cartesian3.fromDegreesArray(coords.flat());

    // 创建多边形几何实例
    instances.push(
      new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(positions),
          // 必须指定顶点格式，与 Appearance 匹配
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        // 每个实例的颜色
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            getColorForEntity(f.properties.Conc)
          ),
        },
        // id 用于后续拾取识别
        id: `primitive-${f.properties.Hour}-${f.properties.Conc}`,
      })
    );
  });

  // 2. 创建 Primitive
  const primitive = new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({
      closed: true,
      translucent: true,
    }),
    asynchronous: true, // 异步创建，不阻塞主线程
  });

  // 3. 添加到场景
  viewer.scene.primitives.add(primitive);

  // 4. 飞到数据位置
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(122.48, 36.98, 50000),
    duration: 2,
  });
};
```

#### 2. 使用 GroundPrimitive 贴合地形

```typescript
/**
 * 使用 GroundPrimitive 贴合地形
 * 特点：自动贴合地形和 3D Tiles
 */
const loadByGroundPrimitive = async () => {
  const geojson = await fetchGeoJson();

  const instances: Cesium.GeometryInstance[] = [];

  geojson.features.forEach((f: any) => {
    const coords = f.geometry.coordinates[0];
    const positions = Cesium.Cartesian3.fromDegreesArray(coords.flat());

    instances.push(
      new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(positions),
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            getColorForEntity(f.properties.Conc)
          ),
        },
        id: `ground-${f.properties.Hour}-${f.properties.Conc}`,
      })
    );
  });

  // GroundPrimitive 会自动贴合地形
  const primitive = new Cesium.GroundPrimitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: true,
    }),
    // 分类类型：贴地形、贴3D Tiles、或两者
    classificationType: Cesium.ClassificationType.BOTH,
    asynchronous: true,
  });

  viewer.scene.primitives.add(primitive);
};
```

#### 3. 点击拾取实现

```typescript
/**
 * Primitive 点击拾取
 * 注意：需要手动实现，不像 Entity 自动支持
 */
let pickHandler: Cesium.ScreenSpaceEventHandler | null = null;

const enablePicking = () => {
  pickHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

  pickHandler.setInputAction(
    (event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      // 使用 scene.pick 进行拾取
      const pickedObject = viewer.scene.pick(event.position);

      if (Cesium.defined(pickedObject) && pickedObject.primitive) {
        // pickedObject.id 就是 GeometryInstance 中设置的 id
        const id = pickedObject.id;
        console.log("点击了要素:", id);

        // 高亮选中的要素
        highlightPrimitive(pickedObject.primitive, id);
      }
    },
    Cesium.ScreenSpaceEventType.LEFT_CLICK
  );
};

// 高亮选中要素
const highlightPrimitive = (primitive: Cesium.Primitive, targetId: string) => {
  // 方法一：修改颜色属性（需要预先存储）
  // 方法二：重新创建带高亮的 Primitive
  // 这里使用方法一的简化版本
  console.log("高亮要素:", targetId);
};

// 禁用拾取
const disablePicking = () => {
  if (pickHandler) {
    pickHandler.destroy();
    pickHandler = null;
  }
};
```

#### 4. 按属性动态着色

```typescript
/**
 * 按属性动态设置颜色
 * 使用 ColorMaterialProperty 或 PerInstanceColorAppearance
 */
const loadWithDynamicColor = async () => {
  const geojson = await fetchGeoJson();
  const instances: Cesium.GeometryInstance[] = [];

  // 颜色映射函数
  const getColorByValue = (value: number): Cesium.Color => {
    const ratio = Math.min(value / 100, 1.0);
    return Cesium.Color.fromHsl((1.0 - ratio) * 0.7, 1.0, 0.5, 0.8);
  };

  geojson.features.forEach((f: any) => {
    const coords = f.geometry.coordinates[0];
    const positions = Cesium.Cartesian3.fromDegreesArray(coords.flat());
    const value = f.properties.Conc;

    instances.push(
      new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(positions),
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            getColorByValue(value)
          ),
        },
        id: `feature-${value}`,
      })
    );
  });

  const primitive = new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: true,
      flat: false, // 是否使用平面着色
    }),
    asynchronous: true,
  });

  viewer.scene.primitives.add(primitive);
};
```

#### 5. 动态更新颜色

```typescript
/**
 * 动态更新 Primitive 颜色
 * 场景：时间序列动画、数据变化
 */

// 存储原始属性以便更新
const featureAttributes = new Map<string, any>();

const loadPrimitiveWithUpdate = async () => {
  const geojson = await fetchGeoJson();
  const instances: Cesium.GeometryInstance[] = [];

  geojson.features.forEach((f: any) => {
    const id = `feature-${f.properties.Hour}-${Date.now()}`;
    const coords = f.geometry.coordinates[0];
    const positions = Cesium.Cartesian3.fromDegreesArray(coords.flat());

    instances.push(
      new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(positions),
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.RED.withAlpha(0.5)
          ),
          // 存储属性用于后续更新
          featureId: new Cesium.ConstantProperty(id),
        },
        id: id,
      })
    );

    // 存储原始数据
    featureAttributes.set(id, f.properties);
  });

  const primitive = new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({
      translucent: true,
    }),
    asynchronous: true,
  });

  viewer.scene.primitives.add(primitive);
  return primitive;
};

/**
 * 更新指定要素的颜色
 * 注意：这种方式需要重新设置整个属性数组
 */
const updatePrimitiveColors = (
  primitive: Cesium.Primitive,
  updates: Map<string, Cesium.Color>
) => {
  // 获取所有几何实例的属性
  const attributes = primitive.getGeometryInstanceAttributes();

  // 遍历并更新颜色
  updates.forEach((color, id) => {
    const attribute = attributes[id];
    if (attribute) {
      // 更新颜色属性
      attribute.color = Cesium.ColorGeometryInstanceAttribute.toValue(color);
    }
  });
};
```

#### 6. 清理 Primitive

```typescript
/**
 * 清理 Primitive 相关资源
 */
const clearPrimitive = (primitive: Cesium.Primitive) => {
  // 从场景移除
  viewer.scene.primitives.remove(primitive);

  // 销毁拾取处理器
  disablePicking();

  // 清空属性缓存
  featureAttributes.clear();
};

// 清除所有 Primitive
const clearAllPrimitives = () => {
  viewer.scene.primitives.removeAll();
  disablePicking();
  featureAttributes.clear();
};
```

### Primitive 类型对比

| 类型 | 说明 | 地形贴合 | 适用场景 |
|------|------|---------|---------|
| `Primitive` | 标准 Primitive | ❌ | 大量静态几何体 |
| `GroundPrimitive` | 地面 Primitive | ✅ | 需要贴合地形的区域 |
| `ClassificationPrimitive` | 分类 Primitive | ✅ | 用于分类标注、挖掘分析 |
| `PointCloudPrimitive` | 点云 Primitive | - | 点云数据渲染 |
| `ModelPrimitive` | 模型 Primitive | - | 3D 模型精细控制 |

### Appearance 类型对比

| Appearance | 说明 | 支持的几何体 |
|------------|------|-------------|
| `PerInstanceColorAppearance` | 每个实例独立颜色 | 所有几何体 |
| `MaterialAppearance` | 材质外观 | Polyline、Wall 等 |
| `PolylineMaterialAppearance` | 线材质 | Polyline |
| `EllipsoidSurfaceAppearance` | 椭球面外观 | 平面几何 |
| `DebugAppearance` | 调试外观 | 所有几何体 |

### 适用场景

- ✅ 数据量 > 10,000 个要素（Entity 会卡顿）
- ✅ 需要最高性能渲染
- ✅ 需要自定义着色器/材质效果
- ✅ 内存敏感场景（移动端、大数据）
- ✅ 静态数据（创建后不频繁修改）
- ⚠️ 需要点击交互（需额外实现）
- ❌ 需要快速开发（开发成本高）

### 注意事项

#### 1. 异步创建

```typescript
const primitive = new Cesium.Primitive({
  geometryInstances: instances,
  appearance: appearance,
  asynchronous: true, // 推荐：异步创建，不阻塞主线程
});

// 监听创建完成事件
primitive.readyPromise.then(() => {
  console.log("Primitive 创建完成");
}).catch((error) => {
  console.error("Primitive 创建失败:", error);
});
```

#### 2. 深度测试与透明度

```typescript
// 透明物体需要关闭深度测试
const appearance = new Cesium.PerInstanceColorAppearance({
  translucent: true,
  renderState: {
    depthTest: {
      enabled: false, // 关闭深度测试
    },
    depthMask: false,
    blending: Cesium.BlendingState.ALPHA_BLEND,
  },
});
```

#### 3. 性能优化建议

```typescript
// 1. 合并几何体减少 draw call
const instances = features.map(f => new GeometryInstance({...}));
// 好：一次创建
const primitive = new Cesium.Primitive({ geometryInstances: instances });

// 2. 使用 VertexFormat 精简顶点数据
const vertexFormat = Cesium.PerInstanceColorAppearance.VERTEX_FORMAT;
// 只包含需要的数据，减少 GPU 内存

// 3. 按需更新
primitive.show = false; // 隐藏而非销毁，便于快速显示

// 4. 批量操作
// 避免：频繁添加/移除
// 推荐：一次性创建，通过 show 或属性控制显示
```

#### 4. 调试技巧

```typescript
// 开启调试模式
viewer.extend(Cesium.viewerCesiumInspectorMixin);

// 使用 DebugAppearance 查看法线
const debugAppearance = new Cesium.DebugAppearance({
  attributeName: 'normal',
});

// 查看 bounding volume
primitive.debugShowBoundingVolume = true;
```

### 与其他方式的关键区别

| 对比项 | Entity/DataSource | Primitive |
|--------|------------------|-----------|
| 创建方式 | `viewer.entities.add()` | `viewer.scene.primitives.add()` |
| 几何定义 | 高级图形属性 | GeometryInstance + Geometry |
| 颜色设置 | `material` 属性 | `ColorGeometryInstanceAttribute` |
| 拾取 | 自动支持 | 需设置 `id` + `scene.pick` |
| 地形贴合 | `clampToGround` | 使用 `GroundPrimitive` |
| 清理 | `entities.remove()` | `scene.primitives.remove()` |
| 更新样式 | 直接修改属性 | 需调用 `getGeometryInstanceAttributes` |

---

## 五种方式对比

### 功能对比

| 对比项 | Entities 手动 | GeoJsonDataSource | Rectangle + Canvas | 影像图层 | Primitive |
|--------|--------------|-------------------|-------------------|---------|-----------|
| 代码复杂度 | 中等 | 低 | 高 | 高 | 高 |
| 地形贴合 | ❌ | ✅ clampToGround | ❌ | ✅ | ✅ GroundPrimitive |
| 点击交互 | ✅ | ✅ | ❌ | ❌ | ⚠️ 需手动实现 |
| 热力图效果 | ❌ | ❌ | ✅ | ✅ | ⚠️ 需自定义着色器 |
| 时间动画 | ❌ | ❌ | ✅ | ✅ | ⚠️ 需手动实现 |
| 样式灵活度 | 高 | 中 | 高 | 高 | 最高 |
| 几何类型 | 需手动处理 | 自动支持所有类型 | 需手动处理 | 需手动处理 | 需手动处理 |
| 自定义着色器 | ❌ | ❌ | ❌ | ❌ | ✅ |

### 性能对比

| 数据量 | Entities 手动 | GeoJsonDataSource | Rectangle + Canvas | 影像图层 | Primitive |
|--------|--------------|-------------------|-------------------|---------|-----------|
| 100 个多边形 | 流畅 | 流畅 | 流畅 | 流畅 | 流畅 |
| 1,000 个多边形 | 轻微卡顿 | 流畅 | 流畅 | 流畅 | 流畅 |
| 10,000 个多边形 | 卡顿明显 | 轻微卡顿 | 流畅 | 流畅 | 流畅 |
| 100,000 个多边形 | 严重卡顿 | 卡顿明显 | 流畅 | 流畅 | 流畅 |
| 1,000,000 个多边形 | 无法运行 | 严重卡顿 | 流畅 | 流畅 | **较流畅** |
| 内存占用 | 高 | 较高 | 低 | 低 | **最低** |
| Draw Calls | N×1 | N×1 | 1 | 1 | **1** |

### Draw Call 原理对比

```
Entity 方式（性能较差）:
┌─────────┐  ┌─────────┐  ┌─────────┐
│Polygon 1│  │Polygon 2│  │Polygon N│
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     ▼            ▼            ▼
  Draw Call 1  Draw Call 2  Draw Call N
     │            │            │
     └────────────┴────────────┘
                  ▼
             GPU 渲染
     （N 个多边形 = N 次 Draw Call）

Primitive 方式（性能最优）:
┌─────────┬─────────┬─────────┐
│Polygon 1│Polygon 2│Polygon N│
└─────────┴─────────┴─────────┘
              │
              ▼
        合并为 GeometryInstances
              │
              ▼
         Draw Call 1
              │
              ▼
         GPU 渲染
   （N 个多边形 = 1 次 Draw Call）
```

### 地形贴合效果

```
Entities 手动:   多边形悬浮在地球表面（有缝隙）
                 ┌─────────────┐
                 │  Polygon    │ ← 悬浮
                 └─────────────┘
              ～～～ 地形表面 ～～～

GeoJsonDataSource:
                 clampToGround: false → 同上，悬浮
                 clampToGround: true  → 贴合地形 ✅

Rectangle:       不贴合地形，悬浮在表面

ImageryLayer:    完美贴合地形
                 ████ 叠加在地形上 ████
              ～～～ 地形表面 ～～～

Primitive:       标准 Primitive → 不贴合地形
                 GroundPrimitive → 贴合地形 ✅
                 ████ 叠加在地形上 ████
              ～～～ 地形表面 ～～～
```

---

## 选择决策树

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            选择合适的加载方式                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  数据量级？                                                                  │
│     │                                                                       │
│     ├── > 10 万要素 ──► Primitive 或 影像图层                               │
│     │                                                                       │
│     └── < 10 万要素 ──► 需要点击交互？                                       │
│                           │                                                 │
│                           ├── 是 ──► 需要贴合地形？                          │
│                           │             │                                   │
│                           │             ├── 是 ──► GeoJsonDataSource        │
│                           │             │           (clampToGround: true)   │
│                           │             │                                   │
│                           │             └── 否 ──► GeoJsonDataSource        │
│                           │                      或 Entities 手动添加        │
│                           │                                                   │
│                           └── 否 ──► 需要热力图/时间动画？                    │
│                                         │                                   │
│                                         ├── 是 ──► 需要贴合地形？            │
│                                         │             │                     │
│                                         │             ├── 是 ──► 影像图层    │
│                                         │             │                     │
│                                         │             └── 否 ──► Rectangle  │
│                                         │                                       │
│                                         └── 否 ──► GeoJsonDataSource         │
│                                                                             │
│  特殊需求：                                                                  │
│     ├── 自定义着色器 ──► Primitive                                          │
│     ├── 最低内存占用 ──► Primitive                                          │
│     └── 最快开发速度 ──► GeoJsonDataSource                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 快速选择指南

| 你的需求 | 推荐方式 | 原因 |
|---------|---------|------|
| 快速加载标准 GeoJSON | GeoJsonDataSource | 一行代码搞定 |
| 需要点击要素并贴合地形 | GeoJsonDataSource + clampToGround | 内置支持 |
| 需要完全控制每个要素样式 | Entities 手动添加 | 灵活度高 |
| 需要热力图效果 | Rectangle + Canvas 或 影像图层 | Canvas 绘制灵活 |
| 需要时间序列动画 | Rectangle + Canvas 或 影像图层 | 切换 Canvas/图层 |
| 需要贴合地形的动画 | 影像图层 + Canvas | 自动贴合地形 |
| 大数据量（>1万要素） | Primitive 或 影像图层 | 批量渲染 |
| 超大数据量（>10万要素） | Primitive | 最高性能 |
| 自定义着色器效果 | Primitive | 完全控制渲染管线 |
| 移动端/内存敏感 | Primitive 或 影像图层 | 内存占用最低 |

---

## 扩展阅读

### 待扩展内容

- [x] ~~方式二：使用 GeoJsonDataSource 加载~~
- [x] ~~方式五：使用 Primitive 优化性能~~
- [ ] 方式六：3D Tiles 矢量切片
- [ ] 点、线要素的处理方式
- [ ] GeoJSON 样式配置（按属性着色）
- [ ] 点击拾取与信息弹窗
- [ ] 大规模数据优化策略
- [ ] 自定义着色器实现热力图

### 相关 API 文档

- [Cesium.Entity](https://cesium.com/learn/cesiumjs/ref-doc/Entity.html)
- [Cesium.GeoJsonDataSource](https://cesium.com/learn/cesiumjs/ref-doc/GeoJsonDataSource.html)
- [Cesium.Primitive](https://cesium.com/learn/cesiumjs/ref-doc/Primitive.html)
- [Cesium.GroundPrimitive](https://cesium.com/learn/cesiumjs/ref-doc/GroundPrimitive.html)
- [Cesium.GeometryInstance](https://cesium.com/learn/cesiumjs/ref-doc/GeometryInstance.html)
- [Cesium.PerInstanceColorAppearance](https://cesium.com/learn/cesiumjs/ref-doc/PerInstanceColorAppearance.html)
- [Cesium.Rectangle](https://cesium.com/learn/cesiumjs/ref-doc/RectangleGraphics.html)
- [Cesium.ImageryLayer](https://cesium.com/learn/cesiumjs/ref-doc/ImageryLayer.html)
- [Cesium.SingleTileImageryProvider](https://cesium.com/learn/cesiumjs/ref-doc/SingleTileImageryProvider.html)

---

## 更新日志

| 日期 | 内容 |
|------|------|
| 2025-10-30 | 初始版本，实现三种加载方式 |
| 2025-10-30 | 抽离工具函数到 utils.ts，优化代码结构 |
| 2025-10-30 | 新增 GeoJsonDataSource 方式，更新对比文档 |
| 2025-10-30 | 新增 Primitive 性能优化方式，完善代码示例 |

---

## 参考资料

- [CesiumJS 官方文档](https://cesium.com/learn/cesiumjs/)
- [GeoJSON 规范](https://geojson.org/)
- [Turf.js 空间分析库](https://turfjs.org/)
