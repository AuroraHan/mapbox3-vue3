<template>
    <!-- 体渲染 -->
    <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'

let cesiumV: Cesium.Viewer;

const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', infoBox: true })
const initCesium = () => {
    cesiumV = getCesiumViewer()
}

onMounted(() => {
    initCesium()
    // geojsonPri()
    // tempRander()
    // geojsonPri1()
    // test3()
    // render()
    aa()
})

const geojsonPri = async () => {
    const result = await fetch('/geojson/grid_points.geojson').then((data) => data.json())
    // debugger
    const instances: Cesium.GeometryInstance[] = [];

    const boxGeometry = Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
        dimensions: new Cesium.Cartesian3(1000.0, 1000.0, 1000.0) // 正方体边长 100 米
    })

    const c = Math.random()
    for (const item of result.features) {
        instances.push(new Cesium.GeometryInstance({
            geometry: boxGeometry,
            modelMatrix: Cesium.Matrix4.multiplyByTranslation(
                Cesium.Transforms.eastNorthUpToFixedFrame(
                    Cesium.Cartesian3.fromDegrees(item.geometry.coordinates[0], item.geometry.coordinates[1]),
                ),
                new Cesium.Cartesian3(0.0, 0.0, 0),
                new Cesium.Matrix4(),
            ),
            attributes: {
                // 所有实例颜色相同（若需不同颜色，使用 ColorGeometryInstanceAttribute）
                // color: new Cesium.ColorGeometryInstanceAttribute(
                //     Cesium.Color.red,
                //     Cesium.Color.fromRandom().green,
                //     Cesium.Color.fromRandom().blue,
                //     1.0
                // )
                color: new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 0.0, 1.0)
            }
        }))
    }

    // 3. 创建 Primitive 并批量渲染
    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance(),
        asynchronous: false     // 同步加载（适合静态数据）
    });
    cesiumV.scene.primitives.add(primitive);
}


//============

const getColorByTemp = (temp: number) => {
    // 假设温度范围0-40℃映射到蓝-红
    const normalized = Cesium.Math.clamp((temp - 0) / 40, 0, 1);
    return Cesium.Color.fromHsl(
        (1.0 - normalized) * 0.6, // 蓝(0.6)到红(0.0)
        1.0,
        0.5
    );
}

const tempRander = async () => {
    // 1. 加载温度数据
    const tempData = await fetch('/geojson/temperature_field.geojson').then(res => res.json());

    // 3. 创建几何实例
    const instances = [];
    const rectangleSize = 100; // 矩形面片大小(米)

    tempData.features.forEach(feature => {
        const position = Cesium.Cartesian3.fromDegrees(
            feature.geometry.coordinates[0],
            feature.geometry.coordinates[1],
            feature.properties.height || 1000
        );

        const temp = feature.properties.temperature;
        const color = getColorByTemp(temp);

        // 创建矩形面片
        instances.push(new Cesium.GeometryInstance({
            geometry: new Cesium.RectangleGeometry({
                rectangle: Cesium.Rectangle.fromCartesianArray([
                    Cesium.Cartesian3.add(
                        position,
                        new Cesium.Cartesian3(-rectangleSize / 2, -rectangleSize / 2, 0),
                        new Cesium.Cartesian3()
                    ),
                    Cesium.Cartesian3.add(
                        position,
                        new Cesium.Cartesian3(rectangleSize / 2, rectangleSize / 2, 0),
                        new Cesium.Cartesian3()
                    )
                ]),
                height: 0,
                vertexFormat: Cesium.VertexFormat.POSITION_AND_COLOR
            }),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
            }
        }));
    });

    // 4. 创建Primitive
    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance({
            flat: true,
            translucent: false
        }),
        asynchronous: false
    });

    cesiumV.scene.primitives.add(primitive);
}


const geojsonPri1 = async () => {
    const result = await fetch('/geojson/temperature_field.geojson').then((data) => data.json())
    // debugger
    const instances: Cesium.GeometryInstance[] = [];

    const boxGeometry = Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
        dimensions: new Cesium.Cartesian3(1000.0, 1000.0, 500.0) // 正方体边长 100 米
    })

    for (const item of result.features) {

        const temp = item.properties.temperature;
        const color = getColorByTemp(temp);

        instances.push(new Cesium.GeometryInstance({
            geometry: boxGeometry,
            modelMatrix: Cesium.Matrix4.multiplyByTranslation(
                Cesium.Transforms.eastNorthUpToFixedFrame(
                    Cesium.Cartesian3.fromDegrees(item.geometry.coordinates[0], item.geometry.coordinates[1]),
                ),
                new Cesium.Cartesian3(0.0, 0.0, 0),
                new Cesium.Matrix4(),
            ),
            attributes: {
                // 所有实例颜色相同（若需不同颜色，使用 ColorGeometryInstanceAttribute）
                // color: new Cesium.ColorGeometryInstanceAttribute(
                //     Cesium.Color.red,
                //     Cesium.Color.fromRandom().green,
                //     Cesium.Color.fromRandom().blue,
                //     1.0
                // )
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
            }
        }))
    }

    // 3. 创建 Primitive 并批量渲染
    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance(),
        asynchronous: false     // 同步加载（适合静态数据）
    });
    cesiumV.scene.primitives.add(primitive);
}


//=============
const test3 = async () => {
    const result = await fetch('/public/geojson/conc-time-linux.geojson').then((data) => data.json())
    const data = result.features.filter((ele: any) => {
        return ele.properties.Hour == 4
    })

    const instances: Cesium.GeometryInstance[] = [];

    const boxGeometry = Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
        dimensions: new Cesium.Cartesian3(1000.0, 1000.0, 500.0) // 正方体边长 100 米
    })

    for (const item of data) {

        instances.push(new Cesium.GeometryInstance({
            geometry: boxGeometry,
            modelMatrix: Cesium.Matrix4.multiplyByTranslation(
                Cesium.Transforms.eastNorthUpToFixedFrame(
                    Cesium.Cartesian3.fromDegrees(item.geometry.coordinates[0][0][0], item.geometry.coordinates[0][0][1]),
                ),
                new Cesium.Cartesian3(0.0, 0.0, 0),
                new Cesium.Matrix4(),
            ),
            attributes: {
                color: new Cesium.ColorGeometryInstanceAttribute(1.0, 1.0, 0.0, 1.0)
            }
        }))
    }

    // 3. 创建 Primitive 并批量渲染
    const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance(),
        asynchronous: false     // 同步加载（适合静态数据）
    });
    cesiumV.scene.primitives.add(primitive);

    cesiumV.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(125.7182120747035, 39.8251270095359, 100000),
    })
}

//============
//测试动态渲染
let currentPrimitive: Cesium.Primitive | null = null;
// 按 Hour 分类存储数据
const hourDataMap = new Map<number, any[]>();

const minHeight = 100;
const maxHeight = 2000;
const minConc = 1e8;  // 你的最小浓度值
const maxConc = 1e11; // 你的最大浓度值

const loadData = async () => {
    // 加载所有数据
    const result = await fetch('/geojson/conc-time-linux.geojson').then((data) => data.json());
    for (let hour = 1; hour <= 6; hour++) {
        const filtered = result.features.filter((ele: any) => ele.properties.Hour === hour);
        hourDataMap.set(hour, filtered);
    }
}

const getColorByConcentration = (conc: number) => {
    // 这里可以根据你的浓度范围定义颜色渐变
    if (conc > 1e10) return Cesium.Color.RED.withAlpha(0.9);
    if (conc > 1e9) return Cesium.Color.ORANGE.withAlpha(0.9);
    if (conc > 1e8) return Cesium.Color.YELLOW.withAlpha(0.9);
    return Cesium.Color.GREEN.withAlpha(0.9);
}

const renderByHour = (hour: number, cesiumV: Cesium.Viewer) => {
    // 移除之前的primitive
    if (currentPrimitive) {
        cesiumV.scene.primitives.remove(currentPrimitive);
    }

    const data = hourDataMap.get(hour);
    if (!data) return;

    const instances: Cesium.GeometryInstance[] = [];

    for (const item of data) {
        // 根据浓度值设置颜色
        const conc = item.properties.Conc;
        const color = getColorByConcentration(conc);

        // 线性映射浓度到高度
        const height = Cesium.Math.lerp(
            minHeight,
            maxHeight,
            Cesium.Math.clamp((conc - minConc) / (maxConc - minConc), 0, 1)
        );

        const boxGeometry = Cesium.BoxGeometry.fromDimensions({
            vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
            dimensions: new Cesium.Cartesian3(1000.0, 1000.0, height)
        });

        instances.push(new Cesium.GeometryInstance({
            geometry: boxGeometry,
            modelMatrix: Cesium.Matrix4.multiplyByTranslation(
                Cesium.Transforms.eastNorthUpToFixedFrame(
                    Cesium.Cartesian3.fromDegrees(
                        item.geometry.coordinates[0][0][0],
                        item.geometry.coordinates[0][0][1]
                    ),
                ),
                new Cesium.Cartesian3(0.0, 0.0, height / 2),
                new Cesium.Matrix4(),
            ),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
            }
        }));
    }

    currentPrimitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.PerInstanceColorAppearance(),
        asynchronous: false
    });

    cesiumV.scene.primitives.add(currentPrimitive);
}

let currentHour = 1;
const render = async () => {
    await loadData()
    renderByHour(4, cesiumV)

    // setInterval(() => {
    //     currentHour = currentHour > 6 ? 1 : currentHour;
    //     renderByHour(currentHour, cesiumV);
    //     currentHour++;
    // }, 2000)
}

//=============================
class WindyTemperatureImageryProvider {
    _url: any;
    _tileWidth: number;
    _tileHeight: number;
    _minimumLevel: any;
    _maximumLevel: any;
    _tilingScheme: Cesium.WebMercatorTilingScheme;
    _ready: boolean;
    constructor(options: any) {
        this._url = options.url;
        this._tileWidth = 256;
        this._tileHeight = 256;
        this._minimumLevel = options.minimumLevel || 0;
        this._maximumLevel = options.maximumLevel || 18;
        this._tilingScheme = new Cesium.WebMercatorTilingScheme();
        this._ready = true;
    }

    get ready() { return this._ready; }
    get tileWidth() { return this._tileWidth; }
    get tileHeight() { return this._tileHeight; }
    get maximumLevel() { return this._maximumLevel; }
    get minimumLevel() { return this._minimumLevel; }
    get tilingScheme() { return this._tilingScheme; }
    get rectangle() { return this._tilingScheme.rectangle; }
    get credit() { return undefined; }
    get hasAlphaChannel() { return true; }

    async requestImage(x: any, y: any, level: any, request: any) {
        const url = this._url
            .replace('{z}', level)
            .replace('{x}', x)
            .replace('{y}', y);

        const blob = await fetch(url).then(r => r.blob());
        const imgBitmap = await createImageBitmap(blob);

        // Windy 原图大小
        const srcWidth = 257;
        const srcHeight = 265;
        const metaHeight = 8;

        // 画到原图canvas
        const fullCanvas = new OffscreenCanvas(srcWidth, srcHeight);
        const fullCtx = fullCanvas.getContext("2d");
        fullCtx?.drawImage(imgBitmap, 0, 0);

        // 获取顶部8行编码信息
        const metaImgData = fullCtx?.getImageData(0, 0, srcWidth, metaHeight);
        const decodeInfo = this._decodeMeta(metaImgData);

        // 裁剪掉顶部8行 & 裁成256×256
        const cropCanvas = new OffscreenCanvas(256, 256);
        const cropCtx = cropCanvas.getContext("2d");
        cropCtx?.drawImage(
            fullCanvas,
            0, metaHeight,   // 源起点
            256, 256,        // 源区域大小
            0, 0,            // 目标起点
            256, 256         // 目标大小
        );

        // 解码颜色
        const imgData = cropCtx?.getImageData(0, 0, 256, 256);
        const pixels = imgData!.data;
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const index = (r << 16) | (g << 8) | b;
            const color = decodeInfo.palette[index] || [r, g, b];
            pixels[i] = color[0];
            pixels[i + 1] = color[1];
            pixels[i + 2] = color[2];
            pixels[i + 3] = 200;//控制透明色
        }
        cropCtx?.putImageData(imgData!, 0, 0);

        return cropCanvas;
    }

    _decodeMeta(imgData: any) {
        const width = imgData.width;
        const data = imgData.data;

        // 1. 调色板（取第0行的颜色）
        const palette = [];
        for (let x = 0; x < width; x++) {
            const i = (0 * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            palette.push([r, g, b]);
        }

        // 2. 温度范围（暂用推测公式）
        const rgbToInt = (r, g, b) => (r << 16) + (g << 8) + b;
        const minPix = (1 * width + 0) * 4;
        const maxPix = (1 * width + 1) * 4;

        const minTempRaw = rgbToInt(data[minPix], data[minPix + 1], data[minPix + 2]);
        const maxTempRaw = rgbToInt(data[maxPix], data[maxPix + 1], data[maxPix + 2]);

        const minTemp = minTempRaw / 100 - 273.15;
        const maxTemp = maxTempRaw / 100 - 273.15;

        return {
            palette,
            minTemp,
            maxTemp
        };
    }
}

const aa = () => {
    const provider = new WindyTemperatureImageryProvider({
        url: 'https://ims.windy.com/im/v3.0/forecast/ecmwf-hres/2025081300/2025081309/wm_grid_257/{z}/{x}/{y}/temp-surface.jpg'
    });

    cesiumV.imageryLayers.addImageryProvider(provider)
}


</script>

<style lang="scss" scoped>
#cesiumContainer {
    height: 100vh;
}
</style>