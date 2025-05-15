<template>
    <div id="map-pop" class="map"></div>
    <CesiumDialog :show="isOpen" @exportCesium="exportCesium" @closeDialog="closeDialog"></CesiumDialog>
</template>

<script lang='ts' setup>
import { ref, onMounted } from 'vue';
import { useMapbox } from '../../hooks/useMapBox'
import { PointLike } from 'mapbox-gl';
import * as Cesium from 'cesium';
import CesiumDialog from '/@/components/cesiumDialog/index.vue'


let mapR: mapboxgl.Map;
const { getMap } = useMapbox({ container: 'map-pop', isOffline: true })


onMounted(() => {
    baseConfig()
})

const isOpen = ref(false)

const baseConfig = () => {
    mapR = getMap()!

    mapR.on('load', () => {
        loadIcon()
    })

    mapR.on('click', ['clusters'], (e) => {
        const bbox = [
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5]
        ] as [PointLike, PointLike];
        //自定义点击图层
        const hdFeatures = mapR!.queryRenderedFeatures(bbox)
        if (hdFeatures.length) {
            isOpen.value = true
        }
        console.log(hdFeatures);
    })
}

//暴露的方法
const exportCesium = (v) => {
    console.log(v, 'cesium');
    addCzml(v)
}

const addCzml = async (cesiumV: Cesium.Viewer) => {
    const dataSource = await cesiumV.dataSources.add(Cesium.CzmlDataSource.load(czml));
    cesiumV.trackedEntity = dataSource.entities.getById('wrj')
}

const czml = [
    {
        id: "document",
        name: "CZML Path",
        version: "1.0",
        clock: {
            interval: "2025-04-28T10:37:10Z/2025-04-28T10:38:50Z",
            currentTime: "2025-04-28T10:37:10Z",
            multiplier: 1,
        },
    },
    {
        id: 'wrj',
        availability: "2025-04-28T10:37:10Z/2025-04-28T10:38:50Z",
        path: {
            material: {
                polylineOutline: {
                    color: {
                        rgba: [255, 0, 255, 255],
                    },
                    outlineColor: {
                        rgba: [0, 255, 255, 255],
                    },
                    outlineWidth: 5,
                },
            },
            width: 8,
            // leadTime: 10,
            // trailTime: 1000,
            // resolution: 5,
        },
        label: {
            text: "无人机1号",
            pixelOffset: {
                "cartesian2": [
                    18.0, 35.0
                ]
            },
            scale: 0.7
        },
        // billboard: {
        //     image:
        //         "data:image/png;base64,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",
        //     scale: 2.5,
        //     eyeOffset: {
        //         cartesian: [0.0, 0.0, -10.0],
        //     },
        // },
        model: {
            gltf: "/models/CesiumDrone.glb",
            scale: 2.0,
            minimumPixelSize: 128,
        },
        orientation: {
            "velocityReference": "#position"
        },
        //可以使用时间序列 或者 给定基于epoch的间隔秒数  时间、经度、纬度、高度
        position: {
            // epoch: "2025-04-28T10:37:10Z",
            cartographicDegrees: [
                "2025-04-28T10:37:10Z", 113.28328631492639, 23.111433215435753, 1500,
                "2025-04-28T10:37:15Z", 113.50714976568543, 23.694634169248147, 2000,
                "2025-04-28T10:37:20Z", 113.6299135935181, 24.169871656793887, 2500,
                "2025-04-28T10:37:25Z", 113.70934901152907, 24.85320754694945, 3000,
                "2025-04-28T10:37:30Z", 113.65157704589103, 25.61746954483914, 3500,
                "2025-04-28T10:37:35Z", 113.49150502960089, 26.297929565617395, 4000,
                "2025-04-28T10:37:40Z", 113.32225282991868, 26.919159149253858, 4500,
                "2025-04-28T10:37:45Z", 112.96275429879444, 27.54911441094461, 5000,
                "2025-04-28T10:37:50Z", 112.9449382777749, 28.234076869525722, 5500,
                "2025-04-28T10:37:55Z", 112.8784720236336, 28.543897602427435, 6000,
                "2025-04-28T10:38:00Z", 112.92669944031508, 29.130070639697294, 6500,
                "2025-04-28T10:38:05Z", 113.14372281537442, 29.697212026021546, 7000,
                "2025-04-28T10:38:10Z", 113.43308669785722, 30.07354009292432, 7500,
                "2025-04-28T10:38:15Z", 113.74053647919294, 30.38085734849267, 8000,
                "2025-04-28T10:38:20Z", 114.17458307056592, 30.583470562015506, 8000,
                "2025-04-28T10:38:25Z", 114.86182323969172, 30.899530905574252, 8000,
                "2025-04-28T10:38:30Z", 115.597291344067, 31.30215750288525, 8000,
                "2025-04-28T10:38:35Z", 116.22424543023169, 31.641504716189345, 7000,
                "2025-04-28T10:38:40Z", 117.20407629814952, 31.812939039523783, 6000,
                "2025-04-28T10:38:45Z", 118.31626581796667, 32.256622831560406, 5500,
                "2025-04-28T10:38:50Z", 118.54273109813403, 33.02364879361495, 5000,
            ]
        }
    }
]


//关闭弹出框的回调
const closeDialog = () => {
    isOpen.value = false
}

//添加图标图层
const loadIcon = () => {
    mapR?.addLayer({
        id: 'clusters',
        type: 'symbol',
        source: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    {
                        "type": "Feature",
                        "properties": { name: '火车站' },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [120, 31]
                        }
                    },
                ]
            }
        },
        layout: {
            'icon-image': 'train',
            'icon-size': 2,
            'text-field': '火车站',
            "text-font": ["Microsoft YaHei Bold"],
            "text-size": 16,
            'text-offset': [0, 2.5],
            'icon-allow-overlap': true // 允许图标重叠
        },
        paint: {
            'icon-opacity': 1, // 图标透明度
            'text-color': '#ff55ff'
        }
    });
}


</script>
<style lang='scss' scoped>
.map {
    height: 100vh;
}
</style>