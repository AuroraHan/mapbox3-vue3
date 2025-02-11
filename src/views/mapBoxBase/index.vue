<template>
    <div id="map" class="map"></div>
    <pre
        class="lonlat">经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}</pre>
    <div class="box" @click="addPoint">json</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import mapbox from 'mapbox-gl';
import { AnimatedGIF, CanvasIcon } from '@sakitam-gis/viz-mapbox-gl';
import { useMapbox } from '../../hooks/useMapBox'

let mapR: mapboxgl.Map;

const { getMap } = useMapbox({ container: 'map' })

//当前经纬度
const jw = ref<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

//当前缩放层级
const zoom = ref<Number>(0)

onMounted(() => {
    baseConfig()
})

const baseConfig = () => {
    mapR = getMap()!
    mapR.on('load', () => {
        // addGif()
        // initWrj()
        // addWrj()

        // threeMarker()
        draw()
    })

    mapR.on('mousemove', (e: { lngLat: { lat: number, lng: number } }) => {
        jw.value = e.lngLat;
    })

    mapR.on('click', (e) => {

    })

    mapR.on('zoom', () => {
        zoom.value = mapR.getZoom() as Number;
    })

    mapR.on('moveend', () => {
    })
}

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

//添加动图
const addGif = () => {
    fetch('/images/fly.gif').then((res) =>
        res.arrayBuffer()
    ).then((res) => {
        const canvasIcon = new CanvasIcon(476, 280, {
            autoPixelRatio: true,
            onAdd(ctx: any) {
                ctx.gif = AnimatedGIF.fromBuffer(res, ctx.context, {});
            },
            renderCallback(ctx: any) {
                ctx.gif.update(performance.now() / 1000);
                ctx.gif.updateFrame();
            },
            postRender(ctx) {
                mapR.triggerRepaint();
            },
        });

        const markerId = `animate-icon`;

        if (!mapR.hasImage(markerId)) {
            mapR.addImage(markerId, canvasIcon);
        }

        mapR.addSource('point', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Point',
                            coordinates: [120, 30],
                        },
                    },

                ],
            },
        });

        mapR.addLayer({
            id: 'point',
            type: 'symbol',
            source: 'point',
            layout: {
                visibility: 'visible',
                'icon-image': markerId,
                'icon-size': 0.2,
                'icon-anchor': 'bottom',
                'icon-ignore-placement': true,
                'icon-allow-overlap': true, // 图标允许压盖
            },
            paint: {},
            filter: ['all', ['in', '$type', 'Point']],
        });
    })
}

//创建canvas对象
const createMovingBallCanvas = () => {
    // 创建 canvas 元素
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    //初始化无人机动图
    const initWrj = () => {
        for (let i = 1; i < 4; i++) {
            mapR.loadImage("/images/wrj/" + i + ".png", (error, image) => {
                mapR.addImage("mwrj" + i, image!);
            });
        }
    }

    const addWrj = () => {
        mapR.addSource('point', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Point',
                            coordinates: [120, 30],
                        },
                    },
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Point',
                            coordinates: [136, 30],
                        },
                    },

                ],
            },
        });

        mapR.addLayer({
            id: 'wrjpoint',
            type: 'symbol',
            source: 'point',
            layout: {
                'icon-image': 'mwrj0',
                'icon-size': 0.3,
                'icon-anchor': 'bottom',
                'icon-ignore-placement': true,
                'icon-allow-overlap': true, // 图标允许压盖
            },
            paint: {},
            filter: ['all', ['in', '$type', 'Point']],
        });

        requestAnimationFrame(updateTaiFengImage);
    }

    const currentI = ref(0)

    // 更新台风图片,实现gif功能
    const updateTaiFengImage = () => {
        let layerId = "wrjpoint";
        if (mapR.getLayer(layerId) != undefined) {
            let currentImage = (currentI.value + 1) % 4;
            mapR.setLayoutProperty(
                layerId,
                "icon-image",
                "mwrj" + currentImage
            );
            currentI.value = currentImage;
        }
        requestAnimationFrame(updateTaiFengImage);
    }


    //方法三 ----- 实现
    const threeMarker = () => {
        const el = document.createElement('canvas')
        el.style.width = '100px'
        el.style.height = '100px'
        el.style.backgroundImage = 'url(/images/fly.gif)'
        el.style.backgroundSize = '100%';

        new mapbox.Marker(el)
            .setLngLat([120, 30])
            .addTo(mapR);
    }

    const ctx = canvas.getContext('2d');

    let x = 10; // 小球的初始 x 坐标
    let y = 10; // 小球的初始 y 坐标
    let dx = 2; // x 方向的速度
    let dy = 2; // y 方向的速度
    const radius = 5; // 小球半径

    function drawBall() {
        ctx?.clearRect(0, 0, canvas.width, canvas.height); // 清除画布
        ctx?.beginPath();
        ctx?.arc(x, y, radius, 0, Math.PI * 2); // 绘制圆形
        ctx!.fillStyle = 'blue';
        ctx?.fill();
        ctx?.closePath();

        // 更新小球位置
        x += dx;
        y += dy;

        // 碰撞检测（反弹）
        if (x + radius > canvas.width || x - radius < 0) {
            dx = -dx;
        }
        if (y + radius > canvas.height || y - radius < 0) {
            dy = -dy;
        }

        requestAnimationFrame(drawBall); // 递归调用动画
    }

    drawBall(); // 启动动画

    return canvas; // 返回 canvas 对象
}

//绘制动态图像
const draw = () => {
    const domC = createMovingBallCanvas()
    console.log(domC);

    new mapbox.Marker(domC)
        .setLngLat([120, 30])
        .addTo(mapR);
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
