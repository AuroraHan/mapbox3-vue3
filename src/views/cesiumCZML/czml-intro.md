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
      -2175790.66,
      4387620.89,
      4073930.57, // 位置 x, y, z
      -3500.12,
      -1500.34,
      500.67 // 速度 vx, vy, vz
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
      0,
      116.39,
      39.9,
      100, // epoch 后 0 秒的位置
      60,
      117.39,
      40.9,
      200, // epoch 后 60 秒的位置
      120,
      118.39,
      41.9,
      300 // epoch 后 120 秒的位置
    ]
  }
}
```

### position 对象的完整属性

| 属性                     | 类型               | 描述                                      |
| ------------------------ | ------------------ | ----------------------------------------- |
| `epoch`                  | ISO8601 时间字符串 | 时间参考点，时间戳的起始时间              |
| `interpolationAlgorithm` | string             | 插值算法：`LAGRANGE`、`LINEAR`、`HERMITE` |
| `interpolationDegree`    | number             | 插值多项式阶数，默认为 1                  |
| `reference`              | string             | 引用另一个对象的位置作为参考              |
| `cartographicDegrees`    | number[]           | 地理坐标（度）数组                        |
| `cartographicRadians`    | number[]           | 地理坐标（弧度）数组                      |
| `cartesian`              | number[]           | 笛卡尔坐标数组                            |
| `cartesianVelocity`      | number[]           | 笛卡尔坐标+速度数组                       |

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
      0, 116.39, 39.9, 100, 60, 117.0, 40.0, 150, 120, 117.5, 40.5, 200
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

| 类型             | 描述        |
| ---------------- | ----------- |
| `point`          | 点          |
| `billboard`      | 广告牌/图标 |
| `label`          | 文字标签    |
| `polyline`       | 折线        |
| `polygon`        | 多边形      |
| `model`          | 3D 模型     |
| `path`           | 路径轨迹    |
| `ellipse`        | 椭圆/圆     |
| `rectangle`      | 矩形区域    |
| `box`            | 盒子        |
| `cylinder`       | 圆柱/圆锥   |
| `ellipsoid`      | 椭球体      |
| `corridor`       | 走廊        |
| `wall`           | 墙体        |
| `polylineVolume` | 折线体      |

---

## 可视化类型详细说明

### Point 点

`point` 用于在场景中绘制 2D 点图形。

```json
{
  "id": "point1",
  "position": {
    "cartographicDegrees": [116.39, 39.9, 100]
  },
  "point": {
    "pixelSize": 12,
    "color": {
      "rgba": [255, 0, 0, 255]
    },
    "outlineColor": {
      "rgba": [255, 255, 255, 255]
    },
    "outlineWidth": 2,
    "heightReference": "CLAMP_TO_GROUND"
  }
}
```

#### Point 属性表

| 属性                       | 类型                     | 描述                                                      |
| -------------------------- | ------------------------ | --------------------------------------------------------- |
| `pixelSize`                | number                   | 像素大小（默认 1）                                        |
| `color`                    | ColorProperty            | 点的颜色                                                  |
| `outlineColor`             | ColorProperty            | 轮廓颜色                                                  |
| `outlineWidth`             | number                   | 轮廓宽度                                                  |
| `heightReference`          | string                   | 高度参考：`NONE`、`CLAMP_TO_GROUND`、`RELATIVE_TO_GROUND` |
| `scaleByDistance`          | NearFarScalar            | 根据距离缩放                                              |
| `translucencyByDistance`   | NearFarScalar            | 根据距离设置透明度                                        |
| `distanceDisplayCondition` | DistanceDisplayCondition | 显示距离条件                                              |
| `disableDepthTestDistance` | number                   | 禁用深度测试的距离                                        |

### Billboard 广告牌

`billboard` 用于在场景中显示始终面向相机的图标或图像。

```json
{
  "id": "billboard1",
  "position": {
    "cartographicDegrees": [116.39, 39.9, 0]
  },
  "billboard": {
    "image": "https://example.com/marker.png",
    "scale": 1.5,
    "horizontalOrigin": "CENTER",
    "verticalOrigin": "BOTTOM",
    "color": {
      "rgba": [255, 255, 255, 255]
    },
    "rotation": 0,
    "heightReference": "CLAMP_TO_GROUND"
  }
}
```

#### Billboard 属性表

| 属性                       | 类型                     | 描述                                            |
| -------------------------- | ------------------------ | ----------------------------------------------- |
| `image`                    | string                   | 图像 URL 或 Data URI                            |
| `scale`                    | number                   | 缩放比例                                        |
| `color`                    | ColorProperty            | 颜色调制（影响图像颜色）                        |
| `rotation`                 | number                   | 旋转角度（弧度）                                |
| `horizontalOrigin`         | string                   | 水平对齐：`LEFT`、`CENTER`、`RIGHT`             |
| `verticalOrigin`           | string                   | 垂直对齐：`TOP`、`CENTER`、`BOTTOM`、`BASELINE` |
| `width`                    | number                   | 宽度（像素，覆盖原始宽度）                      |
| `height`                   | number                   | 高度（像素，覆盖原始高度）                      |
| `heightReference`          | string                   | 高度参考                                        |
| `sizeInMeters`             | boolean                  | 是否以米为单位                                  |
| `pixelOffset`              | Cartesian2               | 像素偏移 [x, y]                                 |
| `eyeOffset`                | Cartesian3               | 眼睛偏移 [x, y, z]                              |
| `scaleByDistance`          | NearFarScalar            | 根据距离缩放                                    |
| `translucencyByDistance`   | NearFarScalar            | 根据距离设置透明度                              |
| `distanceDisplayCondition` | DistanceDisplayCondition | 显示距离条件                                    |
| `disableDepthTestDistance` | number                   | 禁用深度测试的距离                              |

### Label 文字标签

`label` 用于在场景中显示文字。

```json
{
  "id": "label1",
  "position": {
    "cartographicDegrees": [116.39, 39.9, 50]
  },
  "label": {
    "text": "北京",
    "font": "16px sans-serif",
    "fillColor": {
      "rgba": [255, 255, 255, 255]
    },
    "outlineColor": {
      "rgba": [0, 0, 0, 255]
    },
    "outlineWidth": 2,
    "style": "FILL_AND_OUTLINE",
    "horizontalOrigin": "CENTER",
    "verticalOrigin": "CENTER",
    "pixelOffset": [0, -20],
    "showBackground": true,
    "backgroundColor": {
      "rgba": [50, 50, 50, 200]
    },
    "backgroundPadding": [8, 4]
  }
}
```

#### Label 属性表

| 属性                       | 类型                     | 描述                                            |
| -------------------------- | ------------------------ | ----------------------------------------------- |
| `text`                     | string                   | 显示的文字内容                                  |
| `font`                     | string                   | CSS 字体样式                                    |
| `fillColor`                | ColorProperty            | 填充颜色                                        |
| `outlineColor`             | ColorProperty            | 轮廓颜色                                        |
| `outlineWidth`             | number                   | 轮廓宽度                                        |
| `style`                    | string                   | 样式：`FILL`、`OUTLINE`、`FILL_AND_OUTLINE`     |
| `scale`                    | number                   | 缩放比例                                        |
| `horizontalOrigin`         | string                   | 水平对齐：`LEFT`、`CENTER`、`RIGHT`             |
| `verticalOrigin`           | string                   | 垂直对齐：`TOP`、`CENTER`、`BOTTOM`、`BASELINE` |
| `pixelOffset`              | Cartesian2               | 像素偏移                                        |
| `eyeOffset`                | Cartesian3               | 眼睛偏移                                        |
| `heightReference`          | string                   | 高度参考                                        |
| `showBackground`           | boolean                  | 是否显示背景                                    |
| `backgroundColor`          | ColorProperty            | 背景颜色                                        |
| `backgroundPadding`        | Cartesian2               | 背景内边距                                      |
| `scaleByDistance`          | NearFarScalar            | 根据距离缩放                                    |
| `translucencyByDistance`   | NearFarScalar            | 根据距离设置透明度                              |
| `distanceDisplayCondition` | DistanceDisplayCondition | 显示距离条件                                    |
| `disableDepthTestDistance` | number                   | 禁用深度测试的距离                              |

### Polyline 折线

`polyline` 用于绘制连接多点的线段。

```json
{
  "id": "polyline1",
  "polyline": {
    "positions": {
      "cartographicDegrees": [116.39, 39.9, 0, 117.0, 40.0, 0, 117.5, 40.5, 0]
    },
    "width": 3,
    "material": {
      "solidColor": {
        "color": {
          "rgba": [255, 0, 0, 255]
        }
      }
    },
    "clampToGround": true,
    "arcType": "GEODESIC"
  }
}
```

#### Polyline 属性表

| 属性                       | 类型                     | 描述                                          |
| -------------------------- | ------------------------ | --------------------------------------------- |
| `positions`                | PositionProperty         | 线段顶点坐标数组                              |
| `width`                    | number                   | 线宽（像素）                                  |
| `material`                 | MaterialProperty         | 材质（颜色或纹理）                            |
| `clampToGround`            | boolean                  | 是否贴合地形                                  |
| `arcType`                  | string                   | 弧线类型：`NONE`、`GEODESIC`、`RHUMB`         |
| `classificationType`       | string                   | 分类类型：`TERRAIN`、`CESIUM_3D_TILE`、`BOTH` |
| `zIndex`                   | number                   | Z 索引（用于绘制顺序）                        |
| `distanceDisplayCondition` | DistanceDisplayCondition | 显示距离条件                                  |

### Polygon 多边形

`polygon` 用于绘制填充的多边形区域。

```json
{
  "id": "polygon1",
  "polygon": {
    "hierarchy": {
      "positions": {
        "cartographicDegrees": [
          116.0, 39.0, 0, 117.0, 39.0, 0, 117.0, 40.0, 0, 116.0, 40.0, 0
        ]
      },
      "holes": [
        {
          "positions": {
            "cartographicDegrees": [
              116.3, 39.3, 0, 116.7, 39.3, 0, 116.7, 39.7, 0, 116.3, 39.7, 0
            ]
          }
        }
      ]
    },
    "material": {
      "solidColor": {
        "color": {
          "rgba": [255, 0, 0, 128]
        }
      }
    },
    "height": 0,
    "extrudedHeight": 5000,
    "outline": true,
    "outlineColor": {
      "rgba": [255, 255, 255, 255]
    },
    "perPositionHeight": false
  }
}
```

#### Polygon 属性表

| 属性                       | 类型                     | 描述                            |
| -------------------------- | ------------------------ | ------------------------------- |
| `hierarchy`                | PolygonHierarchy         | 多边形层次结构（外边界 + 孔洞） |
| `material`                 | MaterialProperty         | 填充材质                        |
| `height`                   | number                   | 多边形高度（米）                |
| `extrudedHeight`           | number                   | 拉伸高度                        |
| `perPositionHeight`        | boolean                  | 是否使用每个顶点的高度          |
| `closeTop`                 | boolean                  | 是否封闭顶部                    |
| `closeBottom`              | boolean                  | 是否封闭底部                    |
| `outline`                  | boolean                  | 是否显示轮廓                    |
| `outlineColor`             | ColorProperty            | 轮廓颜色                        |
| `outlineWidth`             | number                   | 轮廓宽度                        |
| `fill`                     | boolean                  | 是否填充                        |
| `classificationType`       | string                   | 分类类型                        |
| `zIndex`                   | number                   | Z 索引                          |
| `distanceDisplayCondition` | DistanceDisplayCondition | 显示距离条件                    |

### Model 3D 模型

`model` 用于加载 glTF/GLB 格式的 3D 模型。

```json
{
  "id": "model1",
  "position": {
    "cartographicDegrees": [116.39, 39.9, 100]
  },
  "orientation": {
    "unitQuaternion": [0, 0, 0.707, 0.707]
  },
  "model": {
    "uri": "https://example.com/model.glb",
    "scale": 1.0,
    "minimumPixelSize": 64,
    "maximumScale": 20000,
    "color": {
      "rgba": [255, 255, 255, 255]
    },
    "silhouetteColor": {
      "rgba": [255, 0, 0, 255]
    },
    "silhouetteSize": 2,
    "runAnimations": true,
    "shadows": "ENABLED"
  }
}
```

#### Model 属性表

| 属性                       | 类型                     | 描述                                                         |
| -------------------------- | ------------------------ | ------------------------------------------------------------ |
| `uri`                      | string                   | glTF/GLB 模型 URL                                            |
| `scale`                    | number                   | 缩放比例                                                     |
| `minimumPixelSize`         | number                   | 最小像素尺寸                                                 |
| `maximumScale`             | number                   | 最大缩放比例                                                 |
| `color`                    | ColorProperty            | 颜色调制                                                     |
| `silhouetteColor`          | ColorProperty            | 轮廓发光颜色                                                 |
| `silhouetteSize`           | number                   | 轮廓发光大小                                                 |
| `colorBlendMode`           | string                   | 颜色混合模式：`HIGHLIGHT`、`REPLACE`、`MIX`                  |
| `colorBlendAmount`         | number                   | 颜色混合量（MIX 模式下）                                     |
| `opacity`                  | number                   | 不透明度（0-1）                                              |
| `runAnimations`            | boolean                  | 是否运行动画                                                 |
| `shadows`                  | string                   | 阴影模式：`DISABLED`、`ENABLED`、`CAST_ONLY`、`RECEIVE_ONLY` |
| `heightReference`          | string                   | 高度参考                                                     |
| `distanceDisplayCondition` | DistanceDisplayCondition | 显示距离条件                                                 |

### Path 路径轨迹

`path` 用于显示实体移动的轨迹路径。

```json
{
  "id": "movingEntity",
  "availability": "2024-01-01T00:00:00Z/2024-01-01T01:00:00Z",
  "position": {
    "interpolationAlgorithm": "LAGRANGE",
    "interpolationDegree": 1,
    "epoch": "2024-01-01T00:00:00Z",
    "cartographicDegrees": [
      0, 116.39, 39.9, 100, 300, 117.0, 40.0, 150, 600, 117.5, 40.5, 200
    ]
  },
  "path": {
    "resolution": 60,
    "leadTime": 300,
    "trailTime": 600,
    "material": {
      "solidColor": {
        "color": {
          "rgba": [255, 255, 0, 255]
        }
      }
    },
    "width": 2
  }
}
```

#### Path 属性表

| 属性                       | 类型                     | 描述               |
| -------------------------- | ------------------------ | ------------------ |
| `resolution`               | number                   | 路径分辨率（秒）   |
| `leadTime`                 | number                   | 前方显示时间（秒） |
| `trailTime`                | number                   | 后方轨迹时间（秒） |
| `material`                 | MaterialProperty         | 路径材质           |
| `width`                    | number                   | 路径宽度           |
| `distanceDisplayCondition` | DistanceDisplayCondition | 显示距离条件       |

### Ellipse 椭圆

```json
{
  "id": "ellipse1",
  "position": {
    "cartographicDegrees": [116.39, 39.9, 0]
  },
  "ellipse": {
    "semiMajorAxis": 500,
    "semiMinorAxis": 300,
    "rotation": 0.5,
    "material": {
      "solidColor": {
        "color": {
          "rgba": [0, 255, 0, 128]
        }
      }
    },
    "outline": true,
    "outlineColor": {
      "rgba": [0, 255, 0, 255]
    },
    "height": 0,
    "extrudedHeight": 1000
  }
}
```

#### Ellipse 属性表

| 属性                 | 类型             | 描述                           |
| -------------------- | ---------------- | ------------------------------ |
| `semiMajorAxis`      | number           | 长半轴（米）                   |
| `semiMinorAxis`      | number           | 短半轴（米）                   |
| `rotation`           | number           | 旋转角度（弧度，从北向顺时针） |
| `height`             | number           | 高度                           |
| `extrudedHeight`     | number           | 拉伸高度                       |
| `material`           | MaterialProperty | 填充材质                       |
| `outline`            | boolean          | 是否显示轮廓                   |
| `outlineColor`       | ColorProperty    | 轮廓颜色                       |
| `stRotation`         | number           | 纹理旋转角度                   |
| `classificationType` | string           | 分类类型                       |

### Rectangle 矩形

```json
{
  "id": "rectangle1",
  "rectangle": {
    "coordinates": {
      "wsenDegrees": [116.0, 39.0, 117.0, 40.0]
    },
    "material": {
      "solidColor": {
        "color": {
          "rgba": [0, 0, 255, 128]
        }
      }
    },
    "height": 0,
    "extrudedHeight": 5000,
    "outline": true,
    "outlineColor": {
      "rgba": [255, 255, 255, 255]
    }
  }
}
```

#### Rectangle 属性表

| 属性                 | 类型              | 描述                                    |
| -------------------- | ----------------- | --------------------------------------- |
| `coordinates`        | RectangleProperty | 矩形边界坐标 [west, south, east, north] |
| `material`           | MaterialProperty  | 填充材质                                |
| `height`             | number            | 高度                                    |
| `extrudedHeight`     | number            | 拉伸高度                                |
| `outline`            | boolean           | 是否显示轮廓                            |
| `outlineColor`       | ColorProperty     | 轮廓颜色                                |
| `rotation`           | number            | 旋转角度                                |
| `stRotation`         | number            | 纹理旋转角度                            |
| `classificationType` | string            | 分类类型                                |

### Box 盒子

```json
{
  "id": "box1",
  "position": {
    "cartographicDegrees": [116.39, 39.9, 500]
  },
  "box": {
    "dimensions": {
      "cartesian": [1000, 800, 600]
    },
    "material": {
      "solidColor": {
        "color": {
          "rgba": [255, 165, 0, 200]
        }
      }
    },
    "outline": true,
    "outlineColor": {
      "rgba": [255, 255, 255, 255]
    }
  }
}
```

### Cylinder 圆柱/圆锥

```json
{
  "id": "cylinder1",
  "position": {
    "cartographicDegrees": [116.39, 39.9, 0]
  },
  "cylinder": {
    "length": 10000,
    "topRadius": 1000,
    "bottomRadius": 1000,
    "material": {
      "solidColor": {
        "color": {
          "rgba": [128, 0, 128, 150]
        }
      }
    },
    "outline": true,
    "outlineColor": {
      "rgba": [255, 255, 255, 255]
    }
  }
}
```

> **提示**：设置 `topRadius: 0` 可创建圆锥体。

### Ellipsoid 椭球体

```json
{
  "id": "ellipsoid1",
  "position": {
    "cartographicDegrees": [116.39, 39.9, 0]
  },
  "ellipsoid": {
    "radii": {
      "cartesian": [5000, 5000, 5000]
    },
    "material": {
      "solidColor": {
        "color": {
          "rgba": [0, 255, 255, 100]
        }
      }
    },
    "outline": true,
    "outlineColor": {
      "rgba": [0, 255, 255, 255]
    }
  }
}
```

> **提示**：三个半径相等时为球体。

### Corridor 走廊

```json
{
  "id": "corridor1",
  "corridor": {
    "positions": {
      "cartographicDegrees": [116.0, 39.0, 0, 117.0, 39.5, 0, 118.0, 40.0, 0]
    },
    "width": 500,
    "material": {
      "solidColor": {
        "color": {
          "rgba": [255, 128, 0, 180]
        }
      }
    },
    "cornerType": "ROUNDED",
    "height": 100,
    "extrudedHeight": 500
  }
}
```

#### Corridor 属性表

| 属性             | 类型             | 描述                                      |
| ---------------- | ---------------- | ----------------------------------------- |
| `positions`      | PositionProperty | 路径坐标数组                              |
| `width`          | number           | 走廊宽度（米）                            |
| `material`       | MaterialProperty | 填充材质                                  |
| `cornerType`     | string           | 拐角类型：`ROUNDED`、`MITERED`、`BEVELED` |
| `height`         | number           | 高度                                      |
| `extrudedHeight` | number           | 拉伸高度                                  |

### Wall 墙体

````json
{
  "id": "wall1",
  "wall": {
    "positions": {
      "cartographicDegrees": [
        116.0, 39.0, 1000,
        117.0, 39.5, 1500,
        118.0, 40.0, 1200
      ]
    },
    "minimumHeights": [0, 0, 0],
    "material": {
      "solidColor": {
        "color": {
          "rgba": [100, 149, 237, 200]
        }
      }
    },
    "outline": true,
    "outlineColor": {
      "rgba": [255, 255, 255, 255]
    }
  }
}

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
````

## CZML vs GeoJSON

| 特性       | CZML        | GeoJSON   |
| ---------- | ----------- | --------- |
| 时间动态   | ✅ 支持     | ❌ 不支持 |
| 3D 支持    | ✅ 原生支持 | ⚠️ 需扩展 |
| 可视化样式 | ✅ 丰富     | ⚠️ 基础   |
| 标准化     | Cesium 专用 | OGC 标准  |
| 兼容性     | Cesium      | 广泛支持  |

## 使用场景

1. **卫星轨道可视化** - 描述卫星随时间变化的位置和姿态
2. **交通轨迹追踪** - 显示车辆、飞机等的移动轨迹
3. **历史数据回放** - 按时间轴播放历史事件
4. **实时数据流** - 配合 WebSocket 接收实时 CZML 更新

---

## 颜色系统（Color）

CZML 支持多种颜色表示方式。

### 1. 颜色名称字符串

使用 CSS 颜色名称：

```json
{
  "point": {
    "color": "RED"
  }
}
```

支持的名称包括：`RED`、`GREEN`、`BLUE`、`YELLOW`、`CYAN`、`MAGENTA`、`WHITE`、`BLACK`、`ORANGE`、`PURPLE` 等。

### 2. RGBA 数值

使用 [red, green, blue, alpha] 数组，值范围 0-255：

```json
{
  "point": {
    "color": {
      "rgba": [255, 0, 0, 255]
    }
  }
}
```

### 3. RGB 数值（不透明）

使用 [red, green, blue] 数组，省略 alpha（默认 255）：

```json
{
  "point": {
    "color": {
      "rgbaf": [1.0, 0.0, 0.0, 1.0]
    }
  }
}
```

### 4. HSL 颜色

```json
{
  "point": {
    "color": {
      "hsla": [0, 100, 50, 1.0]
    }
  }
}
```

### 5. 时间动态颜色

颜色可以随时间变化：

```json
{
  "point": {
    "color": {
      "epoch": "2024-01-01T00:00:00Z",
      "rgba": [0, 255, 0, 0, 255, 60, 0, 255, 0, 255, 120, 0, 0, 255, 255]
    }
  }
}
```

---

## 材质系统（Material）

材质用于定义图形的填充外观，比简单颜色更丰富。

### 1. 纯色材质（SolidColor）

```json
{
  "polygon": {
    "material": {
      "solidColor": {
        "color": {
          "rgba": [255, 0, 0, 128]
        }
      }
    }
  }
}
```

### 2. 图像材质（Image）

```json
{
  "polygon": {
    "material": {
      "image": {
        "image": {
          "uri": "https://example.com/texture.png"
        },
        "repeat": [2, 2]
      }
    }
  }
}
```

#### Image 材质属性

| 属性          | 类型             | 描述                |
| ------------- | ---------------- | ------------------- |
| `image`       | string/object    | 图像 URL 或图像对象 |
| `repeat`      | [number, number] | 纹理重复次数        |
| `color`       | ColorProperty    | 颜色调制            |
| `transparent` | boolean          | 是否透明            |

### 3. 网格材质（Grid）

```json
{
  "polygon": {
    "material": {
      "grid": {
        "color": {
          "rgba": [255, 255, 255, 255]
        },
        "cellAlpha": 0.1,
        "lineCount": [10, 10],
        "lineThickness": [1, 1],
        "lineOffset": [0, 0]
      }
    }
  }
}
```

#### Grid 材质属性

| 属性            | 类型             | 描述                |
| --------------- | ---------------- | ------------------- |
| `color`         | ColorProperty    | 线条颜色            |
| `cellAlpha`     | number           | 单元格透明度（0-1） |
| `lineCount`     | [number, number] | 网格线数量          |
| `lineThickness` | [number, number] | 线条粗细            |
| `lineOffset`    | [number, number] | 线条偏移            |

### 4. 条纹材质（Stripe）

```json
{
  "polygon": {
    "material": {
      "stripe": {
        "orientation": "HORIZONTAL",
        "evenColor": {
          "rgba": [255, 255, 255, 255]
        },
        "oddColor": {
          "rgba": [0, 0, 0, 255]
        },
        "offset": 0,
        "repeat": 5
      }
    }
  }
}
```

#### Stripe 材质属性

| 属性          | 类型          | 描述                           |
| ------------- | ------------- | ------------------------------ |
| `orientation` | string        | 方向：`HORIZONTAL`、`VERTICAL` |
| `evenColor`   | ColorProperty | 偶数条纹颜色                   |
| `oddColor`    | ColorProperty | 奇数条纹颜色                   |
| `offset`      | number        | 偏移量                         |
| `repeat`      | number        | 重复次数                       |

### 5. 棋盘材质（Checkerboard）

```json
{
  "polygon": {
    "material": {
      "checkerboard": {
        "evenColor": {
          "rgba": [255, 255, 255, 255]
        },
        "oddColor": {
          "rgba": [0, 0, 0, 255]
        },
        "repeat": [5, 5]
      }
    }
  }
}
```

### 6. 波尔卡点材质（PolkaDot）

```json
{
  "polygon": {
    "material": {
      "polkaDot": {
        "color": {
          "rgba": [255, 0, 0, 255]
        },
        "cellAlpha": 0.5,
        "dotRadius": 0.2,
        "repeat": [10, 10]
      }
    }
  }
}
```

### 7. 轮廓材质（Outline）

```json
{
  "polygon": {
    "material": {
      "outline": {
        "color": {
          "rgba": [255, 255, 255, 255]
        },
        "cellAlpha": 0.0,
        "outlineColor": {
          "rgba": [255, 0, 0, 255]
        },
        "outlineWidth": 2
      }
    }
  }
}
```

### 8. 动态颜色材质

材质颜色可以随时间变化：

```json
{
  "polygon": {
    "material": {
      "solidColor": {
        "color": {
          "epoch": "2024-01-01T00:00:00Z",
          "rgba": [0, 255, 0, 0, 255, 60, 0, 255, 0, 255, 120, 0, 0, 255, 255]
        }
      }
    }
  }
}
```

---

## 时间动态属性

### availability 可用性区间

`availability` 定义实体在时间轴上的可见范围：

```json
{
  "id": "satellite",
  "availability": [
    "2024-01-01T00:00:00Z/2024-01-01T02:00:00Z",
    "2024-01-01T04:00:00Z/2024-01-01T06:00:00Z"
  ],
  "position": {...}
}
```

时间区间格式为 ISO8601 时间范围：`开始时间/结束时间`。

### 时钟配置（Clock）

在文档包中配置全局时钟：

```json
{
  "id": "document",
  "version": "1.0",
  "clock": {
    "interval": "2024-01-01T00:00:00Z/2024-01-02T00:00:00Z",
    "currentTime": "2024-01-01T00:00:00Z",
    "range": "LOOP_STOP",
    "step": "SYSTEM_CLOCK_MULTIPLIER",
    "multiplier": 60
  }
}
```

#### Clock 属性

| 属性          | 类型   | 描述                                                  |
| ------------- | ------ | ----------------------------------------------------- |
| `interval`    | string | 时间范围                                              |
| `currentTime` | string | 当前时间                                              |
| `range`       | string | 播放范围：`UNBOUNDED`、`CLAMPED`、`LOOP_STOP`         |
| `step`        | string | 步进方式：`SYSTEM_CLOCK_MULTIPLIER`、`TICK_DEPENDENT` |
| `multiplier`  | number | 时间倍速                                              |

### 时间间隔属性（Interval）

某些属性可以按时间间隔设置不同值：

```json
{
  "point": {
    "pixelSize": [
      {
        "interval": "2024-01-01T00:00:00Z/2024-01-01T01:00:00Z",
        "number": 10
      },
      {
        "interval": "2024-01-01T01:00:00Z/2024-01-01T02:00:00Z",
        "number": 20
      }
    ]
  }
}
```

---

## 方向与姿态（Orientation）

### 单位四元数（Unit Quaternion）

用于定义 3D 模型或实体的朝向：

```json
{
  "id": "airplane",
  "position": {
    "cartographicDegrees": [116.39, 39.9, 1000]
  },
  "orientation": {
    "unitQuaternion": [0, 0, 0.707, 0.707]
  },
  "model": {
    "uri": "airplane.glb"
  }
}
```

四元数格式为 [x, y, z, w]。

### 速度方向（VelocityOrientation）

根据运动方向自动计算朝向：

```json
{
  "id": "movingObject",
  "orientation": {
    "velocityReference": "#position"
  },
  "position": {...}
}
```

---

## 视角配置（ViewFrom）

定义默认观察视角：

```json
{
  "id": "entity1",
  "viewFrom": {
    "cartesian": [-100, -100, 100]
  }
}
```

当用户点击实体并选择"查看"时，相机将定位到此偏移位置。

---

## 属性引用（Reference）

CZML 支持属性引用，让一个属性值引用另一个实体或属性。

### 引用其他实体的位置

```json
[
  {
    "id": "vehicle",
    "position": {
      "cartographicDegrees": [116.39, 39.9, 0]
    }
  },
  {
    "id": "sensor",
    "position": {
      "reference": "vehicle#position"
    },
    "point": {
      "color": "RED",
      "pixelSize": 8
    }
  }
]
```

### 引用其他实体的属性

```json
[
  {
    "id": "target",
    "point": {
      "color": {
        "rgba": [255, 0, 0, 255]
      },
      "pixelSize": 10
    }
  },
  {
    "id": "follower",
    "point": {
      "color": {
        "reference": "target#point.color"
      },
      "pixelSize": {
        "reference": "target#point.pixelSize"
      }
    }
  }
]
```

---

## 描述与属性（Description & Properties）

### 描述信息

实体的描述信息会显示在信息框中，支持 HTML：

```json
{
  "id": "poi",
  "name": "北京",
  "description": "<h2>北京市</h2><p>中国首都</p><ul><li>人口：2100万</li><li>面积：16410 km²</li></ul>",
  "position": {
    "cartographicDegrees": [116.39, 39.9, 0]
  },
  "point": {
    "pixelSize": 10,
    "color": "RED"
  }
}
```

### 自定义属性

使用 `properties` 添加自定义数据：

```json
{
  "id": "city",
  "name": "上海",
  "properties": {
    "population": 24000000,
    "area": 6340,
    "isCapital": false,
    "districts": ["黄浦区", "徐汇区", "长宁区"]
  },
  "position": {
    "cartographicDegrees": [121.47, 31.23, 0]
  },
  "point": {
    "pixelSize": 10,
    "color": "BLUE"
  }
}
```

---

## 删除操作

### 删除实体

```json
{
  "id": "entityToDelete",
  "delete": true
}
```

### 删除属性

```json
{
  "id": "entity1",
  "point": {
    "delete": true
  }
}
```

### 删除所有实体

```json
{
  "id": "document",
  "delete": "all"
}
```

---

## 完整示例

### 示例1：卫星轨道可视化

```json
[
  {
    "id": "document",
    "name": "卫星轨道演示",
    "version": "1.0",
    "clock": {
      "interval": "2024-01-01T00:00:00Z/2024-01-01T02:00:00Z",
      "currentTime": "2024-01-01T00:00:00Z",
      "multiplier": 60,
      "range": "LOOP_STOP"
    }
  },
  {
    "id": "satellite",
    "name": "ISS",
    "availability": "2024-01-01T00:00:00Z/2024-01-01T02:00:00Z",
    "position": {
      "interpolationAlgorithm": "LAGRANGE",
      "interpolationDegree": 5,
      "referenceFrame": "INERTIAL",
      "epoch": "2024-01-01T00:00:00Z",
      "cartesian": [
        0, -6788.728e3, 272.385e3, -164.051e3, 60, -6783.467e3, 890.457e3,
        -376.575e3, 120, -6597.629e3, 1496.847e3, -582.865e3
      ]
    },
    "point": {
      "pixelSize": 10,
      "color": {
        "rgba": [255, 255, 0, 255]
      },
      "outlineColor": {
        "rgba": [255, 255, 255, 255]
      },
      "outlineWidth": 2
    },
    "path": {
      "show": true,
      "width": 2,
      "material": {
        "solidColor": {
          "color": {
            "rgba": [255, 255, 0, 200]
          }
        }
      },
      "resolution": 60,
      "leadTime": 0,
      "trailTime": 3600
    },
    "label": {
      "text": "ISS",
      "font": "14px sans-serif",
      "fillColor": {
        "rgba": [255, 255, 255, 255]
      },
      "outlineColor": {
        "rgba": [0, 0, 0, 255]
      },
      "outlineWidth": 2,
      "pixelOffset": [0, -15]
    }
  }
]
```

### 示例2：带轨迹的移动车辆

```json
[
  {
    "id": "document",
    "name": "车辆追踪",
    "version": "1.0"
  },
  {
    "id": "vehicle",
    "name": "出租车 A001",
    "availability": "2024-01-01T00:00:00Z/2024-01-01T01:00:00Z",
    "position": {
      "interpolationAlgorithm": "LINEAR",
      "epoch": "2024-01-01T00:00:00Z",
      "cartographicDegrees": [
        0, 116.391, 39.906, 0, 300, 116.401, 39.916, 0, 600, 116.411, 39.926, 0,
        900, 116.421, 39.936, 0, 1200, 116.431, 39.946, 0
      ]
    },
    "orientation": {
      "velocityReference": "#position"
    },
    "billboard": {
      "image": "https://example.com/car.png",
      "scale": 0.5,
      "horizontalOrigin": "CENTER",
      "verticalOrigin": "CENTER"
    },
    "path": {
      "resolution": 10,
      "material": {
        "solidColor": {
          "color": {
            "rgba": [0, 255, 0, 255]
          }
        }
      },
      "width": 3,
      "leadTime": 0,
      "trailTime": 3600
    },
    "properties": {
      "driver": "张三",
      "plateNumber": "京A001"
    }
  }
]
```

### 示例3：区域标记与动态颜色

```json
[
  {
    "id": "document",
    "name": "区域监控",
    "version": "1.0"
  },
  {
    "id": "alertZone",
    "name": "警戒区域",
    "polygon": {
      "hierarchy": {
        "positions": {
          "cartographicDegrees": [
            116.38, 39.9, 0, 116.4, 39.9, 0, 116.4, 39.92, 0, 116.38, 39.92, 0
          ]
        }
      },
      "material": {
        "solidColor": {
          "color": {
            "epoch": "2024-01-01T00:00:00Z",
            "rgba": [
              0, 255, 0, 0, 100, 30, 255, 165, 0, 150, 60, 255, 0, 0, 200, 90,
              255, 165, 0, 150, 120, 255, 0, 0, 100
            ]
          }
        }
      },
      "outline": true,
      "outlineColor": {
        "rgba": [255, 255, 255, 255]
      }
    },
    "description": "<h2>警戒区域</h2><p>状态：监控中</p>"
  }
]
```

### 示例4：3D 建筑群

```json
[
  {
    "id": "document",
    "name": "建筑群",
    "version": "1.0"
  },
  {
    "id": "building1",
    "name": "塔楼 A",
    "position": {
      "cartographicDegrees": [116.39, 39.9, 0]
    },
    "box": {
      "dimensions": {
        "cartesian": [50, 50, 200]
      },
      "material": {
        "solidColor": {
          "color": {
            "rgba": [100, 149, 237, 200]
          }
        }
      },
      "outline": true,
      "outlineColor": {
        "rgba": [255, 255, 255, 255]
      }
    }
  },
  {
    "id": "building2",
    "name": "塔楼 B",
    "position": {
      "cartographicDegrees": [116.395, 39.9, 0]
    },
    "cylinder": {
      "length": 150,
      "topRadius": 30,
      "bottomRadius": 35,
      "material": {
        "solidColor": {
          "color": {
            "rgba": [144, 238, 144, 180]
          }
        }
      }
    }
  }
]
```

---

## 高级特性

### 父子层级关系

实体可以建立父子关系，父实体的可见性会影响子实体：

```json
[
  {
    "id": "group1",
    "name": "车辆组 A"
  },
  {
    "id": "car1",
    "parent": "group1",
    "name": "车辆 1",
    "position": {
      "cartographicDegrees": [116.39, 39.9, 0]
    },
    "point": {
      "pixelSize": 10,
      "color": "RED"
    }
  },
  {
    "id": "car2",
    "parent": "group1",
    "name": "车辆 2",
    "position": {
      "cartographicDegrees": [116.4, 39.91, 0]
    },
    "point": {
      "pixelSize": 10,
      "color": "BLUE"
    }
  }
]
```

设置 `group1` 的 `show` 为 `false` 会隐藏所有子实体。

### 嵌套属性

某些属性支持嵌套结构：

```json
{
  "polygon": {
    "hierarchy": {
      "positions": {
        "cartographicDegrees": [116, 39, 0, 117, 39, 0, 117, 40, 0, 116, 40, 0]
      },
      "holes": [
        {
          "positions": {
            "cartographicDegrees": [
              116.2, 39.2, 0, 116.8, 39.2, 0, 116.8, 39.8, 0, 116.2, 39.8, 0
            ]
          }
        }
      ]
    }
  }
}
```

### 距离显示条件

控制实体在不同距离下的可见性：

```json
{
  "point": {
    "pixelSize": 10,
    "color": "RED",
    "distanceDisplayCondition": {
      "near": 100,
      "far": 1000000
    }
  }
}
```

实体只在距离相机 100 米到 1,000,000 米之间可见。

### 近远缩放（NearFarScalar）

根据距离自动调整大小或透明度：

```json
{
  "billboard": {
    "image": "marker.png",
    "scale": 1.0,
    "scaleByDistance": {
      "near": 100,
      "nearValue": 2.0,
      "far": 1000000,
      "farValue": 0.5
    },
    "translucencyByDistance": {
      "near": 100,
      "nearValue": 1.0,
      "far": 500000,
      "farValue": 0.0
    }
  }
}
```

---

## 在 CesiumJS 中加载 CZML

### 基本加载

```javascript
import { CzmlDataSource, Viewer } from "cesium";

const viewer = new Viewer("cesiumContainer");

// 方式1：从数组加载
const czml = [
  { id: "document", version: "1.0" },
  {
    id: "point1",
    position: { cartographicDegrees: [116.39, 39.9, 0] },
    point: { pixelSize: 10, color: "RED" },
  },
];

const dataSource = await CzmlDataSource.load(czml);
viewer.dataSources.add(dataSource);
viewer.zoomTo(dataSource);

// 方式2：从 URL 加载
const remoteDataSource = await CzmlDataSource.load(
  "https://example.com/data.czml",
);
viewer.dataSources.add(remoteDataSource);
```

### 增量更新

使用 `process()` 追加新数据而不清除现有数据：

```javascript
// 初始加载
const dataSource = await CzmlDataSource.load(initialCzml);
viewer.dataSources.add(dataSource);

// 后续增量更新
await dataSource.process(updateCzml);
```

### 移除数据源

```javascript
// 移除特定数据源
viewer.dataSources.remove(dataSource);

// 移除所有数据源
viewer.dataSources.removeAll();
```

### 访问实体

```javascript
// 获取数据源中的所有实体
const entities = dataSource.entities.values;

// 按 ID 获取实体
const entity = dataSource.entities.getById("point1");

// 获取实体属性
const position = entity.position.getValue(viewer.clock.currentTime);
```

### 时钟控制

```javascript
// 同步时钟
viewer.clock.shouldAnimate = true;
viewer.clock.multiplier = 10; // 10倍速

// 监听时间变化
viewer.clock.onTick.addEventListener(() => {
  console.log("Current time:", viewer.clock.currentTime);
});
```

---

## 调试技巧

### 1. 验证 JSON 格式

使用 JSON 验证器确保 CZML 格式正确：

```javascript
try {
  JSON.parse(czmlString);
} catch (e) {
  console.error("Invalid JSON:", e.message);
}
```

### 2. 检查坐标值

确保经纬度在有效范围内：

- 经度：-180 到 180
- 纬度：-90 到 90
- 高度：建议使用米为单位

### 3. 时间格式

使用 ISO8601 格式的时间字符串：

```
2024-01-01T00:00:00Z
```

### 4. 常见错误

| 错误       | 原因            | 解决方案                                 |
| ---------- | --------------- | ---------------------------------------- |
| 实体不显示 | 坐标超出范围    | 检查经纬度值                             |
| 动画不播放 | 时钟未启动      | 设置 `viewer.clock.shouldAnimate = true` |
| 路径不显示 | `path` 属性缺失 | 添加 `path` 配置                         |
| 颜色无效   | RGBA 值错误     | 确保值在 0-255 范围                      |
| 位置不更新 | 缺少 `epoch`    | 添加时间参考点                           |

---

## 参考资源

- [Cesium CZML 官方文档](https://cesium.com/learn/cesiumjs/ref-doc/CzmlDataSource.html)
- [CZML 结构参考](https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/CZML-Guide)
- [CZML 结构详解](https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/CZML-Structure)
- [Cesium 沙盒示例](https://sandcastle.cesium.com/)
- [CesiumJS Entity API](https://cesium.com/learn/cesiumjs/ref-doc/Entity.html)
