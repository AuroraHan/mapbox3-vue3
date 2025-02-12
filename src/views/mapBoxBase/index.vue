<template>
    <div id="map" class="map"></div>
    <pre
        class="lonlat">经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}</pre>
    <div class="box" @click="addPoint">json</div>
</template>

<script setup lang="ts">
import { onMounted, ref, createApp } from 'vue'
import mapbox, { PointLike } from 'mapbox-gl';
import { AnimatedGIF, CanvasIcon } from '@sakitam-gis/viz-mapbox-gl';
import { useMapbox } from '../../hooks/useMapBox'
import Popup from './components/popup.vue';

let mapR: mapboxgl.Map;

const { getMap } = useMapbox({ container: 'map' })

//当前经纬度
const jw = ref<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

//当前缩放层级
const zoom = ref<Number>(0)

onMounted(() => {
    baseConfig()
})

//弹出框实例
const popup = new mapbox.Popup({
    closeButton: false,
});

const baseConfig = () => {
    mapR = getMap()!
    mapR.on('load', () => {
        addWrjByJs()
    })

    mapR.on('mousemove', (e: { lngLat: { lat: number, lng: number } }) => {
        jw.value = e.lngLat;
    })

    mapR.on('click', ['wrjpoint'], (e) => {
        const bbox = [
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5]
        ] as [PointLike, PointLike];
        //自定义点击图层
        const hdFeatures = mapR!.queryRenderedFeatures(bbox)
        console.log(hdFeatures);
    })

    mapR.on('zoom', () => {
        zoom.value = mapR.getZoom() as Number;
    })

    mapR.on('moveend', () => {
    })
}


//添加点图层
const addPoint = () => {
    mapR.addSource('china', {
        type: 'geojson',
        data: './geojson/grid_points.geojson',
    })

    mapR.addLayer({
        id: 'china',
        source: 'china',
        type: 'circle',
        minzoom: 2,
        maxzoom: 18,
        'paint': {
            'circle-color': '#ff0000', // blue color fill
        }
    })
}

//添加外部geojson
const addGeoJson = () => {
    mapR.flyTo({
        center: [
            106.59223698054778,
            26.60328385825539
        ],
        zoom: 12
    })
    mapR.addSource('china', {
        type: 'geojson',
        data: './geojson/grid_points.geojson',
    })

    mapR.addLayer({
        id: 'china',
        source: 'china',
        type: 'fill',
        minzoom: 2,
        maxzoom: 18,
        'paint': {
            'fill-color': '#ff0000', // blue color fill
            'fill-opacity': 0.6,
            "fill-outline-color": '#000000'
        }
    })


    // mapR.addLayer({
    //     'id': 'outline',
    //     'type': 'line',
    //     'source': 'china',
    //     'layout': {},
    //     'paint': {
    //         'line-color': '#ffff00',
    //         'line-width': 1
    //     }
    // });
}

//根据第三方来绘制无人机
const drawWrjByJs = (marker: any) => {
    // 设置 Konva 舞台和图层
    const properties = marker.properties
    const el = document.createElement("div");
    el.id = properties.id;

    el.addEventListener('click', () => {
        console.log(marker, 'lll');

        getSiteInfo(marker)
    }, { passive: true })

    document.body.appendChild(el);
    let stage = new Konva.Stage({
        container: properties.id,
        width: 100,
        height: 100,
    });

    let layer = new Konva.Layer();
    stage.add(layer);

    // 封装绘制无人机的方法
    function drawDrone(x, y, scale, lightColor) {
        var color_1 = "#ff6768";
        // 创建一个组用于整体旋转
        let droneGroup = new Konva.Group({
            x: x,
            y: y,
            rotation: 90, // 整体旋转 90 度
        });
        layer.add(droneGroup);

        // 创建支架臂
        let arms = [
            {
                x1: -22 * scale,
                y1: -16 * scale,
                x2: -45 * scale,
                y2: -45 * scale,
            },
            { x1: 15 * scale, y1: -18 * scale, x2: 30 * scale, y2: -50 * scale },
            { x1: -22 * scale, y1: 16 * scale, x2: -45 * scale, y2: 45 * scale },
            { x1: 15 * scale, y1: 18 * scale, x2: 30 * scale, y2: 50 * scale },
        ];

        arms.forEach((arm) => {
            let line = new Konva.Line({
                points: [arm.x1, arm.y1, arm.x2, arm.y2],
                stroke: "#9299A3",
                strokeWidth: 4 * scale,
                lineCap: "round",
            });
            droneGroup.add(line);
        });

        // 创建4个电机（圆）
        let circles = [
            { x: -45 * scale, y: -45 * scale, radius: 8 * scale },
            { x: 30 * scale, y: -50 * scale, radius: 8 * scale },
            { x: -45 * scale, y: 45 * scale, radius: 8 * scale },
            { x: 30 * scale, y: 50 * scale, radius: 8 * scale },
        ];

        circles.forEach((circle) => {
            let shape = new Konva.Circle({
                x: circle.x,
                y: circle.y,
                radius: circle.radius,
                fill: "#666768", // 圆的颜色
                strokeWidth: 2 * scale,
            });
            droneGroup.add(shape);
        });

        // 创建无人机主体
        let body = new Konva.Rect({
            x: -50 * scale,
            y: -14 * scale,
            width: 60 * scale,
            height: 28 * scale,
            fill: color_1,
            cornerRadius: 8 * scale, //圆角
            stroke: color_1, // 添加边框颜色
            strokeWidth: 1 * scale, //边框宽度
        });
        droneGroup.add(body);

        // 创建无人机主体1
        let body1 = new Konva.Rect({
            x: -5 * scale,
            y: -17.5 * scale,
            width: 50 * scale,
            height: 35 * scale,
            fill: color_1,
            cornerRadius: 12 * scale, //圆角
            stroke: color_1, // 添加边框颜色
            strokeWidth: 1 * scale, //边框宽度
        });
        droneGroup.add(body1);

        // 创建无人机主体2
        let body2 = new Konva.Rect({
            x: -12 * scale,
            y: -16 * scale,
            width: 32 * scale,
            height: 32 * scale,
            fill: color_1,
            cornerRadius: 12 * scale, //圆角
            stroke: color_1, // 添加边框颜色
            strokeWidth: 1 * scale, //边框宽度
        });
        droneGroup.add(body2);

        // 指示灯
        let indicatorLight = new Konva.Circle({
            x: 18 * scale,
            y: 0,
            radius: 4 * scale,
            fill: lightColor, // 指示灯颜色
            strokeWidth: 2 * scale,
        });
        droneGroup.add(indicatorLight);

        let indicatorLight1 = new Konva.Circle({
            x: 8 * scale,
            y: 0,
            radius: 2 * scale,
            fill: lightColor, // 指示灯颜色
            strokeWidth: 2 * scale,
        });
        droneGroup.add(indicatorLight1);

        let indicatorLight2 = new Konva.Circle({
            x: 0 * scale,
            y: 0,
            radius: 2 * scale,
            fill: lightColor, // 指示灯颜色
            strokeWidth: 2 * scale,
        });
        droneGroup.add(indicatorLight2);

        let indicatorLight3 = new Konva.Circle({
            x: -8 * scale,
            y: 0,
            radius: 2 * scale,
            fill: lightColor, // 指示灯颜色
            strokeWidth: 2 * scale,
        });
        droneGroup.add(indicatorLight3);

        // 添加螺旋桨位置
        let propellerPositions = [
            { x: -45 * scale, y: -45 * scale },
            { x: 30 * scale, y: -50 * scale },
            { x: -45 * scale, y: 45 * scale },
            { x: 30 * scale, y: 50 * scale },
        ];

        let bladeLength = 13 * scale; // 定义螺旋桨线条长度
        let bladeWidth = 4 * scale; // 定义螺旋桨线条宽度

        let propellerGroups = [];

        propellerPositions.forEach((pos) => {
            let group = new Konva.Group({
                x: pos.x,
                y: pos.y,
            });

            for (let i = 0; i < 2; i++) {
                // 每个螺旋桨有两片叶片
                let angle = Math.PI * i;
                let line = new Konva.Line({
                    points: [
                        bladeLength * Math.cos(angle),
                        bladeLength * Math.sin(angle),
                        2 * bladeLength * Math.cos(angle),
                        2 * bladeLength * Math.sin(angle),
                    ],
                    stroke: "rgb(0, 0, 255)",
                    strokeWidth: bladeWidth,
                    lineCap: "round",
                });
                group.add(line);
            }

            droneGroup.add(group);
            propellerGroups.push(group);
        });

        // 添加旋转动画
        let angularSpeed = 1800; // 每秒旋转角度（度）
        let anim = new Konva.Animation((frame) => {
            let angleDiff = (angularSpeed * frame.timeDiff) / 1000; // 每帧旋转角度
            propellerGroups.forEach((group) => {
                group.rotation((group.rotation() || 0) + angleDiff);
            });
        }, layer);

        anim.start(); // 开始动画
    }

    drawDrone(50, 50, 0.5, "rgb(0,255,0)");

    return el
}

const addWrjByJs = () => {

    const geojson = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'properties': {
                    'id': 'container0',
                    'className': 'marker',
                    'imageId': 1011,
                    'iconSize': [60, 60]
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [120, 30]
                }
            },
            {
                'type': 'Feature',
                'properties': {
                    'id': 'container1',
                    'className': 'marker',
                    'imageId': 1012,
                    'iconSize': [60, 60]
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [100, 30]
                }
            },
            {
                'type': 'Feature',
                'properties': {
                    'id': 'container2',
                    'className': 'marker',
                    'imageId': 1012,
                    'iconSize': [60, 60]
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [100, 35]
                }
            },
            {
                'type': 'Feature',
                'properties': {
                    'id': 'container3',
                    'className': 'marker',
                    'imageId': 1012,
                    'iconSize': [60, 60]
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [120, 35]
                }
            },
            {
                'type': 'Feature',
                'properties': {
                    'id': 'container4',
                    'className': 'marker',
                    'imageId': 1012,
                    'iconSize': [60, 60]
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [120, 40]
                }
            },
            {
                'type': 'Feature',
                'properties': {
                    'id': 'container5',
                    'className': 'marker',
                    'imageId': 1012,
                    'iconSize': [60, 60]
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [120, 20]
                }
            },
            {
                'type': 'Feature',
                'properties': {
                    'id': 'container6',
                    'className': 'marker',
                    'imageId': 1012,
                    'iconSize': [60, 60]
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [110, 25]
                }
            },
        ]
    }

    for (const marker of geojson.features) {
        const dom = drawWrjByJs(marker)
        new mapbox.Marker(dom)
            .setLngLat(marker.geometry.coordinates)
            .addTo(mapR);
    }

    mapR.addSource('point', {
        type: 'geojson',
        data: geojson,
    });
    mapR.addLayer({
        id: 'wrjpoint',
        type: 'symbol',
        source: 'point',
        layout: {
            'text-field': '无人机',
            'text-offset': [0, 2],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            // "text-anchor": "top",
            'text-font': ['Microsoft YaHei Bold'],
            'text-size': 18,
        },
        paint: {
            'text-color': '#f8ffc5',
        },
        filter: ['all', ['in', '$type', 'Point']],
    });
}

//添加自定义弹出框
const getSiteInfo = (data: any) => {
    if (data?.properties) {
        const container = document.createElement('div')
        //@ts-ignore
        createApp(Popup, { objInfo: data.properties }).mount(container)
        //@ts-ignore
        popup.setLngLat(data.geometry.coordinates).setDOMContent(container).addTo(mapR!)
    }
}
</script>

<style lang="scss" scoped>
.map {
    height: 100vh;
}

.lonlat {
    z-index: 9;
    width: 320px;
    font-size: 15px;
    line-height: 35px;
    padding: 0 3px;
    height: 35px;
    background-color: rgb(191, 192, 192);
    position: absolute;
    bottom: 3%;
    left: 3%;
    text-align: center;
}

.box {
    width: 50px;
    height: 50px;
    text-align: center;
    position: absolute;
    left: 1%;
    bottom: 10%;
    z-index: 9;
    background-color: red;
}
</style>
