<template>
    <div id="map"></div>
    <div class="box"></div>
</template>

<script setup lang="ts">
import { onMounted, createApp } from 'vue';
import mapbox from 'mapbox-gl';
import MPop from './mPop.vue';
import emitter from '/@/mitt/index';
import * as Turf from '@turf/turf'
import { useMapbox } from '../../hooks/useMapBox'

let mapR: mapboxgl.Map | null = null;
const { getMap } = useMapbox({ container: 'map', isOffline: true })
onMounted(() => {
    proConfig()
})

//基础配置
const proConfig = () => {
    mapR = getMap()
    mapR?.on('load', () => {
        loadData()
    })

    mapR?.on('click', (e) => {
        customPopup([e.lngLat.lng, e.lngLat.lat])
    })

}

//接受事件
emitter.on('test', (e: any) => {
    console.log(e, 'gggggg');

})

const customPopup = (e: any) => {
    let popup = new mapbox.Popup()
    const container = document.createElement('div')
    createApp(MPop, { title: 'gggg' }).mount(container)
    popup.setLngLat(e).setDOMContent(container).addTo(mapR!)
}

//画线
const constLine = () => {
    const line = Turf.lineString([[112, 20], [117, 33]]);

    mapR?.addSource('cline', {
        type: 'geojson',
        data: line
    })

    mapR?.addLayer({
        id: 'cline',
        type: 'line',
        source: 'cline',
        paint: {
            'line-color': '#ffff00'
        }
    })
}

let droneData: Array<any> = []; // 存储无人机轨迹数据
const loadData = () => {
    // fetch('/geojson/flypath.geojson')
    //     .then(response => response.json())
    //     .then(data => {
    //         droneData = data.features
    //             .map(f => ({
    //                 lng: f.geometry.coordinates[0],
    //                 lat: f.geometry.coordinates[1],
    //                 // alt: f.properties.altitude,
    //                 time: new Date(f.properties.timestamp).getTime()
    //             }))
    //             .sort((a, b) => a.time - b.time);

    //         initAnimation();
    //         // createTimelineControl();
    //     });

    const flyPath = [
        [113.28328631492639, 23.111433215435753],
        [113.50714976568543, 23.694634169248147],
        [113.6299135935181, 24.169871656793887],
        [113.70934901152907, 24.85320754694945],
        [113.65157704589103, 25.61746954483914],
        [113.49150502960089, 26.297929565617395],
        [113.32225282991868, 26.919159149253858],
        [112.96275429879444, 27.54911441094461],
        [112.9449382777749, 28.234076869525722],
        [112.8784720236336, 28.543897602427435],
        [112.92669944031508, 29.130070639697294],
        [113.14372281537442, 29.697212026021546],
        [113.43308669785722, 30.07354009292432],
        [113.74053647919294, 30.38085734849267],
        [114.17458307056592, 30.583470562015506],
        [114.86182323969172, 30.899530905574252],
        [115.597291344067, 31.30215750288525],
        [116.22424543023169, 31.641504716189345],
        [117.20407629814952, 31.812939039523783],
        [118.31626581796667, 32.256622831560406],
        [118.54273109813403, 33.02364879361495]
    ]


    //计算总长度
    const lineDistance = Turf.length(Turf.lineString(flyPath));

    const route = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': flyPath
                }
            }
        ]
    };

    const point = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'properties': { bearing: 0 },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [113.28328631492639, 23.111433215435753]
                }
            }
        ]
    };

    mapR?.addSource('point', {
        type: 'geojson',
        data: point
    });

    mapR?.addLayer({
        'id': 'point',
        'type': 'model',
        'source': 'point',
        'layout': {
            'model-id': 'http://localhost:4000/models/CesiumDrone.glb'
            // 'model-id': 'https://docs.mapbox.com/mapbox-gl-js/assets/tower.glb'
        },
        'paint': {
            'model-opacity': 1,
            'model-rotation': [0.0, 0.0, ['get', 'bearing']],
            'model-scale': [1500, 1500, 1500],
            // 'model-color-mix-intensity': 0,
            // 'model-cast-shadows': true,
            // 'model-emissive-strength': 0.8
        }
    });

    // 添加飞行路径线
    mapR?.addSource('flight-path', {
        type: 'geojson',
        data: route
    });

    mapR?.addLayer({
        id: 'flight-path',
        type: 'line',
        source: 'flight-path',
        paint: {
            'line-color': '#ff0000',
            'line-width': 3
        }
    });

    const arc = [];
    const steps = 50;
    for (let i = 0; i < lineDistance; i += lineDistance / steps) {
        const segment = Turf.along(route.features[0], i);
        arc.push(segment.geometry.coordinates);
    }

    let counter = 0;

    function animate() {
        const start =
            route.features[0].geometry.coordinates[
            counter >= steps ? counter - 1 : counter
            ];
        const end =
            route.features[0].geometry.coordinates[
            counter >= steps ? counter : counter + 1
            ];
        // debugger


        if (!start || !end) {
            return;
        }

        point.features[0].geometry.coordinates =
            route.features[0].geometry.coordinates[counter];

        point.features[0].properties.bearing = Turf.bearing(
            Turf.point(start),
            Turf.point(end)
        );

        mapR?.getSource('point').setData(point);

        if (counter < steps) {
            requestAnimationFrame(animate);
        }

        counter = counter + 1;
        console.log(point.features[0].geometry.coordinates);

    }

    animate()
}

function initAnimation() {
    // 添加无人机模型源
    mapR?.addSource('drone', {
        type: 'geojson',
        data: {
            'type': 'Feature',
            'properties': {
                bearing: 200
            },
            'geometry': {
                'coordinates': [droneData[0].lng, droneData[0].lat],
                'type': 'Point'
            }
        }
    })

    mapR?.addLayer({
        'id': 'drone-model',
        'type': 'model',
        'source': 'drone',
        'layout': {
            'model-id': 'http://localhost:4000/models/CesiumDrone.glb'
            // 'model-id': 'https://docs.mapbox.com/mapbox-gl-js/assets/tower.glb'
        },
        'paint': {
            'model-opacity': 1,
            'model-rotation': [0.0, 0.0, ['get', 'bearing']],
            'model-scale': [100, 100, 100],
            // 'model-color-mix-intensity': 0,
            // 'model-cast-shadows': true,
            // 'model-emissive-strength': 0.8
        }
    });


}


</script>

<style scoped>
#map {
    height: 100vh;
}

.box {
    position: absolute;
    left: 4%;
    top: 5%;
    z-index: 9;
    width: 100px;
    height: 30px;
    background-color: rgb(165, 233, 210);
    border-radius: 4px;
}
</style>