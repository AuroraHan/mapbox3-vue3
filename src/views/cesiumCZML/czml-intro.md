# CZML 简介

## 什么是 CZML

CZML（Cesium Language）是一种基于 JSON 的描述时间动态图形场景的语言，专为 Cesium 设计。它允许你描述场景中的对象及其随时间变化的属性。

## CZML 的特点

### 1. 基于 JSON 格式
CZML 本质上是 JSON 格式的数据，易于阅读、编写和解析。

### 2. 时间动态性
CZML 的核心特性是支持时间动态数据。你可以描述对象属性如何随时间变化，例如：
- 卫星轨道
- 移动的车辆
- 动态变化的颜色、大小等

### 3. 声明式描述
通过声明式的方式描述场景，而非命令式编程，使得数据可以独立于代码存储和传输。

## CZML 文档结构

一个 CZML 文档是一个 JSON 数组，数组中的每个元素称为一个"包"（packet），描述一个对象。

```json
[
  {
    "id": "document",
    "name": "CZML Document",
    "version": "1.0"
  },
  {
    "id": "point1",
    "name": "示例点",
    "position": {
      "cartographicDegrees": [116.39, 39.9, 0]
    },
    "point": {
      "pixelSize": 10,
      "color": "red"
    }
  }
]
```

### 文档包（Document Packet）
数组的第一个元素通常是文档包，包含：
- `id`: 固定为 "document"
- `name`: 文档名称
- `version`: CZML 版本号
- `clock`: 时钟配置（可选）

### 对象包（Object Packet）
描述场景中的具体对象，包含：
- `id`: 对象的唯一标识符
- `name`: 对象名称（可选）
- `position`: 位置信息
- `point`/`billboard`/`label` 等: 可视化属性

## Position 位置属性详解

`position` 是 CZML 中最核心的属性之一，用于定义对象在 3D 空间中的位置。

### 坐标参考系统

CZML 支持多种坐标表示方式：

#### 1. cartographicDegrees（地理坐标-度）
使用经度、纬度、高度表示，单位为度。

```json
{
  "position": {
    "cartographicDegrees": [116.39, 39.9, 100]
  }
}
```
- 第1个值：经度（-180 到 180）
- 第2个值：纬度（-90 到 90）
- 第3个值：高度（米，相对于 WGS84 椭球体）

#### 2. cartographicRadians（地理坐标-弧度）
与 `cartographicDegrees` 相同，但单位为弧度。

```json
{
  "position": {
    "cartographicRadians": [2.0319, 0.6969, 100]
  }
}
```

#### 3. cartesian（笛卡尔坐标）
使用 ECEF（地心地固坐标系）的 X、Y、Z 坐标，单位为米。

```json
{
  "position": {
    "cartesian": [-2175790.66, 4387620.89, 4073930.57]
  }
}
```

#### 4. cartesianVelocity（笛卡尔坐标+速度）
包含位置和速度信息，用于精确的轨道计算。

```json
{
  "position": {
    "cartesianVelocity": [
      -2175790.66, 4387620.89, 4073930.57,  // 位置 x, y, z
      -3500.12, -1500.34, 500.67              // 速度 vx, vy, vz
    ]
  }
}
```

### 时间动态位置

当位置随时间变化时，需要在坐标数组前添加时间偏移值：

#### 数组格式：`[时间, 值1, 值2, 值3, 时间, 值1, 值2, 值3, ...]`

```json
{
  "position": {
    "epoch": "2024-01-01T00:00:00Z",
    "cartographicDegrees": [
      0,    116.39, 39.9, 100,    // epoch 后 0 秒的位置
      60,   117.39, 40.9, 200,    // epoch 后 60 秒的位置
      120,  118.39, 41.9, 300     // epoch 后 120 秒的位置
    ]
  }
}
```

### position 对象的完整属性

| 属性 | 类型 | 描述 |
|------|------|------|
| `epoch` | ISO8601 时间字符串 | 时间参考点，时间戳的起始时间 |
| `interpolationAlgorithm` | string | 插值算法：`LAGRANGE`、`LINEAR`、`HERMITE` |
| `interpolationDegree` | number | 插值多项式阶数，默认为 1 |
| `reference` | string | 引用另一个对象的位置作为参考 |
| `cartographicDegrees` | number[] | 地理坐标（度）数组 |
| `cartographicRadians` | number[] | 地理坐标（弧度）数组 |
| `cartesian` | number[] | 笛卡尔坐标数组 |
| `cartesianVelocity` | number[] | 笛卡尔坐标+速度数组 |

### 插值算法详解

#### LAGRANGE（拉格朗日插值）
```json
{
  "position": {
    "interpolationAlgorithm": "LAGRANGE",
    "interpolationDegree": 5,
    "epoch": "2024-01-01T00:00:00Z",
    "cartographicDegrees": [...]
  }
}
```
- 适用于平滑轨迹
- `interpolationDegree` 越高，曲线越平滑但计算量越大

#### LINEAR（线性插值）
```json
{
  "position": {
    "interpolationAlgorithm": "LINEAR",
    "epoch": "2024-01-01T00:00:00Z",
    "cartographicDegrees": [...]
  }
}
```
- 点与点之间直线连接
- 计算速度快，适合离散点

#### HERMITE（埃尔米特插值）
```json
{
  "position": {
    "interpolationAlgorithm": "HERMITE",
    "epoch": "2024-01-01T00:00:00Z",
    "cartesianVelocity": [...]
  }
}
```
- 需要配合 `cartesianVelocity` 使用
- 精确控制运动方向和速度
- 常用于卫星轨道

### 位置引用（reference）

可以引用其他对象的位置：

```json
[
  {
    "id": "vehicle1",
    "position": {
      "cartographicDegrees": [116.39, 39.9, 100]
    }
  },
  {
    "id": "sensor1",
    "position": {
      "reference": "vehicle1#position"
    }
  }
]
```

### 完整示例

#### 静态位置
```json
{
  "id": "staticPoint",
  "position": {
    "cartographicDegrees": [116.39, 39.9, 0]
  },
  "point": {
    "pixelSize": 10,
    "color": "RED"
  }
}
```

#### 动态轨迹
```json
{
  "id": "movingPoint",
  "availability": "2024-01-01T00:00:00Z/2024-01-01T00:02:00Z",
  "position": {
    "interpolationAlgorithm": "LAGRANGE",
    "interpolationDegree": 1,
    "epoch": "2024-01-01T00:00:00Z",
    "cartographicDegrees": [
      0,    116.39, 39.9, 100,
      60,   117.0,  40.0, 150,
      120,  117.5,  40.5, 200
    ]
  },
  "point": {
    "pixelSize": 10,
    "color": "BLUE"
  },
  "path": {
    "material": {
      "solidColor": {
        "color": "YELLOW"
      }
    },
    "width": 2
  }
}
```

## 常用属性类型

### 位置属性（Position）
```json
{
  "position": {
    "cartographicDegrees": [经度, 纬度, 高度]
  }
}
```

或使用笛卡尔坐标：
```json
{
  "position": {
    "cartesian": [x, y, z]
  }
}
```

## 常见可视化类型

| 类型 | 描述 |
|------|------|
| `point` | 点 |
| `billboard` | 广告牌/图标 |
| `label` | 文字标签 |
| `polyline` | 折线 |
| `polygon` | 多边形 |
| `model` | 3D 模型 |
| `path` | 路径轨迹 |

## 在 CesiumJS 中加载 CZML

```javascript
import { CzmlDataSource, Viewer } from 'cesium'

// 加载 CZML 数据
const czmlData = [...] // CZML JSON 数组

const dataSourcePromise = CzmlDataSource.load(czmlData)
viewer.dataSources.add(dataSourcePromise)

// 或者从 URL 加载
CzmlDataSource.load('path/to/czml.json').then(dataSource => {
  viewer.dataSources.add(dataSource)
  viewer.zoomTo(dataSource)
})
```

## CZML vs GeoJSON

| 特性 | CZML | GeoJSON |
|------|------|---------|
| 时间动态 | ✅ 支持 | ❌ 不支持 |
| 3D 支持 | ✅ 原生支持 | ⚠️ 需扩展 |
| 可视化样式 | ✅ 丰富 | ⚠️ 基础 |
| 标准化 | Cesium 专用 | OGC 标准 |
| 兼容性 | Cesium | 广泛支持 |

## 使用场景

1. **卫星轨道可视化** - 描述卫星随时间变化的位置和姿态
2. **交通轨迹追踪** - 显示车辆、飞机等的移动轨迹
3. **历史数据回放** - 按时间轴播放历史事件
4. **实时数据流** - 配合 WebSocket 接收实时 CZML 更新

## 参考资源

- [Cesium CZML 官方文档](https://cesium.com/learn/cesiumjs/ref-doc/CzmlDataSource.html)
- [CZML 结构参考](https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/CZML-Guide)
- [Cesium 沙盒示例](https://sandcastle.cesium.com/)