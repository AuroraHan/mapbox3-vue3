<template>
    <div id="map" class="map"></div>
    <pre
        class="lonlat">经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}</pre>
    <div class="box" @click="addSmokeMaterial">3D</div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import mapbox from 'mapbox-gl';
import * as THREE from 'three';
import { range, texture, mix, uv, color, rotateUV, positionLocal, time, uniform } from 'three/tsl';
import { WebGPURenderer } from 'three/webgpu'
import { Threebox } from 'threebox-plugin';

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


const initMap = () => {
    mapbox.accessToken = "pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA";
    const map = new mapbox.Map({
        container: 'map',
        projection: "mercator",
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [120, 30],
        zoom: 2,
    })

    mapR = map;
    tb = window.tb = new Threebox(
        map,
        map.getCanvas().getContext('webgl'), //get the context from the map canvas
        { defaultLights: true }
    );
    map.on('mousemove', (e: { lngLat: { lat: number, lng: number } }) => {
        jw.value = e.lngLat;
    })

    map.on('zoom', () => {
        zoom.value = map.getZoom() as Number;
    })
}

const addCustom = () => {
    mapR.addLayer({
        id: 'box1',
        type: 'custom',
        onAdd: function (map, gl) {
            // let geometry = new THREE.BoxGeometry(3000, 3000, 3000);
            const geometry = new THREE.ConeGeometry(1000, 1000, 32);
            let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0xffff00 }));

            const cube = tb.Object3D({ obj: mesh, units: 'meters', adjustment: { x: 0.5, y: 1, z: -0.5 } });
            cube.rotation.x = Math.PI / 2
            cube.setCoords([112, 31]);
            tb.add(cube);
        },
        render: function (gl, matrix) {
            tb.update(); //update Threebox scene
        }
    })
}

//在粒子上添加纹理贴图
const addSmokeMaterial = () => {
    const textureLoader = new THREE.TextureLoader();
    const smokeTexture = textureLoader.load('/images/smoke1.png');
    const positions = [];
    const geometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x888888,
        size: 100,
        map: smokeTexture,
        blending: THREE.AdditiveBlending,
        transparent: true
    });

    const n = 2000, n2 = n / 2; // particles spread in the cube
    const height = 300; // 圆锥体高度
    const radius = 200; // 底部圆的半径

    for (let i = 0; i < 2000; i++) {
        // y 坐标从 0 到 -height 范围
        const y = -Math.random() * height;

        // 根据 y 坐标计算半径，使其随高度增大
        const r = (1 + y / height) * radius;

        // 生成围绕圆锥体中心的角度 theta
        const theta = Math.random() * 2 * Math.PI;

        // x 和 z 坐标基于半径 r 和角度 theta 来计算
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        // 将计算得到的 x, y, z 添加到 positions 数组中
        positions.push(x, y, z);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    const particleSystem = new THREE.Points(geometry, particleMaterial);

    let cube;
    mapR.addLayer({
        id: 'smoke',
        type: 'custom',
        onAdd: function (map, gl) {
            cube = tb.Object3D({ obj: particleSystem, units: 'meters', adjustment: { x: 0, y: 1, z: 0 } });
            cube.rotation.x = Math.PI / 2
            cube.setCoords([112, 31]);
            tb.add(cube);
        },
        render: function (gl, matrix) {
            // cube.rotation.y += 0.01;
            tb.update();
        }
    });
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
