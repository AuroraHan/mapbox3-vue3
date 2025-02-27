<template>
    <div id="map" class="map"></div>
    <pre
        class="lonlat">经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}</pre>
    <div class="box" @click="addCustom">飞机</div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import mapbox from 'mapbox-gl';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Threebox } from 'threebox-plugin';
import { LngLatLike } from 'mapbox-gl';

let mapR: mapboxgl.Map;
let tb;

onMounted(() => {
    initMap()
})

onUnmounted(() => {
    mapR.remove()
})

//当前经纬度
const jw = ref<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

//当前缩放层级
const zoom = ref<Number>(0)

let mapConfig = {
    MAD: {
        origin: [-3.460539968876, 40.4849214450, 0],
        destination: [-3.378467560041173, 40.551832030917126, 1500],
        center: [-3.44885, 40.49198] as LngLatLike,
        zoom: 13.4,
        pitch: 50,
        bearing: -13,
        scale: 0.3,
        timezone: 'Europe/Madrid'
    },
    names: {
        customLayer: "custom-layer"
    }
}

let stats, gui;
function animate() {
    requestAnimationFrame(animate);
    stats.update();
}

let plane;
let api = {
    fixedZoom: true,
    pan: true,
    maxZoom: 15
};

const initMap = () => {
    mapbox.accessToken = "pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA";
    const map = new mapbox.Map({
        container: 'map',
        projection: "mercator",
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: mapConfig.MAD.center,
        zoom: mapConfig.MAD.zoom,
        pitch: mapConfig.MAD.pitch,
        antialias: true,
        bearing: mapConfig.MAD.bearing
    })

    mapR = map;
    //@ts-ignore
    tb = window.tb = new Threebox(
        map,
        map.getCanvas().getContext('webgl'), //get the context from the map canvas
        {
            defaultLights: true,
            enableSelectingObjects: true, //change this to false to disable 3D objects selection
            enableTooltips: true,
        }
    );
    tb.altitudeStep = 1;
    tb.setSunlight(new Date(2021, 0, 18, 12));


    map.on('mousemove', (e: { lngLat: { lat: number, lng: number } }) => {
        jw.value = e.lngLat;
    })

    map.on('zoom', () => {
        zoom.value = map.getZoom() as Number;
    })

    map.on('load', () => {
        init()
    })
}

function init() {
    // stats
    stats = new Stats();
    mapR.getContainer().appendChild(stats.dom);
    animate();
    // gui
    gui = new GUI();
    // this will define if there's a fixed zoom level for the model
    gui.add(api, 'fixedZoom').name('fixed zoom').onChange(changeScale);
    gui.add(api, 'pan').name('pan').onChange(changeScale);
    gui.add(api, 'maxZoom', 0, mapR.transform.maxZoom).step(0.5).onChange(changeScale);
}

//飞机飞行时不断触发
function onObjectChanged(e) {
    let model = e.detail.object; //here's the object already modified
    // 使用动画过渡将地图平移到指定位置
    if (api.pan) mapR.panTo(model.coordinates);
}

function changeScale() {
    plane.fixedZoom = (api.fixedZoom ? api.maxZoom : null);
    plane.setObjectScale(mapR.transform.scale);
    tb.map.repaint = true;
}

let line;

const fly = (data: any) => {
    // extract path geometry from callback geojson, and set duration of travel
    var options = {
        path: data.geometry.coordinates,
        duration: 40000
    }

    // start the truck animation with above options, and remove the line when animation ends
    //使用上述选项启动卡车动画，并在动画结束时删除该线
    plane.followPath(
        options,
        function () {
            tb.remove(line);
        }
    );

    // set up geometry for a line to be added to map, lofting it up a bit for *style*
    let lineGeometry = options.path;

    // create and add line object 画出航线
    line = tb.line({
        geometry: lineGeometry,
        width: 5,
        color: 'steelblue'
    })

    //添加线图层
    tb.add(line, mapConfig.names.customLayer);
}

const addCustom = () => {
    mapR.addLayer({
        id: 'box1',
        type: 'custom',
        onAdd: function (map, gl) {
            // Creative Commons License attribution: Plane model by https://sketchfab.com/ideehochzwei
            // from  https://sketchfab.com/3d-models/plane-aa001f5a88f64b16b98356c042f2d5f3

            //3D模型
            let options = {
                obj: '/models/royale_plane.glb',
                type: 'gltf',
                scale: mapConfig.MAD.scale,
                rotation: { x: -90, y: 0, z: 180 },
                anchor: 'center',
                bbox: false
            }

            //@ts-ignore
            if (api.fixedZoom) options.fixedZoom = api.maxZoom;

            tb.loadObj(options, function (model) {
                plane = model
                    .setCoords(mapConfig.MAD.origin);
                // plane.setRotation({ x: 90, y: 90, z: 90 })
                plane.addTooltip("You can set the fixed scale of this plane", true);
                plane.addEventListener('ObjectChanged', onObjectChanged, false);
                //返回投射阴影的对象选项的值
                plane.castShadow = true;
                tb.add(plane);

                fly(flightPlan);

                // setTimeout(() => {
                //     let opt = {
                //         coords: [9, 40.5, 1500], duration: 120000
                //     };
                //     plane.set(opt)
                // }, 3000);

            })
        },
        render: function (gl, matrix) {
            tb.update();
        }
    })
}


let flightPlan = {
    "geometry": {
        "coordinates": [
            [
                -3.459164318324355,
                40.483196679459695,
                0
            ],
            [
                -3.46032158100065006,
                40.48405772625512,
                0
            ],
            [
                -3.4601480276212726,
                40.48464924045098,
                0
            ],
            [
                -3.4605399688768728,
                40.48492144503072,
                0
            ],
            [
                -3.4544247306827174,
                40.489871726679894,
                0
            ],
            [
                -3.4419511970175165,
                40.49989552385142,
                100
            ],
            [
                -3.4199262740950473,
                40.51776139362727,
                800
            ],
            [
                -3.4064155093898023,
                40.52744748436612,
                1000
            ],
            [
                -3.394276165400413,
                40.53214151673197,
                1400
            ],
            [
                -3.3774962506359145,
                40.53130304189972,
                1800
            ],
            [
                -3.35977648690141,
                40.523996322867305,
                2000
            ],
            [
                -3.3492733309630296,
                40.51239798757899,
                1000
            ],
            [
                -3.345716577158697,
                40.494919870461985,
                1000
            ],
            [
                -3.351353597163751,
                40.4797236141558,
                1000
            ],
            [
                -3.3787722011184655,
                40.45432754114316,
                1000
            ],
            [
                -3.4223595762896935,
                40.41937230956262,
                1000
            ],
            [
                -3.444433667203299,
                40.40449665396977,
                1000
            ],
            [
                -3.4678526394398546,
                40.39535552525871,
                1000
            ],
            [
                -3.4864554257066516,
                40.39245520592732,
                1000
            ],
            [
                -3.503812672766088,
                40.39513567933946,
                1000
            ],
            [
                -3.5170856837534643,
                40.40280870363367,
                1000
            ],
            [
                -3.526080266123671,
                40.41452098042856,
                1000
            ],
            [
                -3.5294395670147196,
                40.42627781810833,
                1000
            ],
            [
                -3.5263900139946713,
                40.43272665526561,
                1000
            ],
            [
                -3.520955322876091,
                40.43652271714541,
                900
            ],
            [
                -3.512454752467022,
                40.442395503099675,
                600
            ],
            [
                -3.496113157862709,
                40.45605326123382,
                400
            ],
            [
                -3.4802314192833705,
                40.46895283940685,
                200
            ],
            [
                -3.4673761065382394,
                40.47937019244051,
                100
            ],
            [
                -3.4611694105603874,
                40.4843367730719,
                0
            ],
            [
                -3.460447314584286,
                40.48495391198887,
                0
            ],
            [
                -3.460162097548647,
                40.48469346302471,
                0
            ],
            [
                -3.460400363301318,
                40.48398852655413,
                0
            ],
            [
                -3.4591431034406526,
                40.48323937836338,
                0
            ]
        ],
        "type": "LineString"
    },
    "type": "Feature",
    "properties": {}
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
