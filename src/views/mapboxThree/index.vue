<template>
    <div id="map" class="map"></div>
    <pre
        class="lonlat">经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}</pre>
    <div class="box">

        <div class="item" @click="baseBox">加载基础正方体</div>
        <div class="item" @click="threeParticle">加载基础粒子</div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as THREE from 'three';
import lodash from 'lodash'
import { useMapbox } from '../../hooks/useMapBox'
import * as Turf from '@turf/turf'
import mapboxgl, { CustomLayerInterface, LngLatLike } from 'mapbox-gl';

let mapR: mapboxgl.Map;

const { getMap } = useMapbox({ container: 'map', isOffline: false })

onMounted(() => {
    baseConfig()

})

//当前经纬度
const jw = ref<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

//当前缩放层级
const zoom = ref<Number>(0)


const baseConfig = () => {
    mapR = getMap()!


    mapR.on('mousemove', (e: { lngLat: { lat: number, lng: number } }) => {
        jw.value = e.lngLat;
    })

    mapR.on('zoom', () => {
        zoom.value = mapR.getZoom() as Number;
    })

    mapR.on('load', () => {
        mapR.setCenter([116.4, 39.9])
        mapR.setZoom(15)
    })
}


//-------正方体效果
const baseBox = () => {

    const modelRotate = [Math.PI / 2, 0, 0];
    // 坐标转换
    const modelAsMercator = mapboxgl.MercatorCoordinate.fromLngLat(
        [116.4, 39.9],
        150
    );
    // 烟雾参数配置
    const cubeConfig = {
        position: [116.4, 39.9], // 经纬度
        size: 100, // 边长(米)
        altitude: 0, // 地面高度
        rotateX: modelRotate[0],
        rotateY: modelRotate[1],
        rotateZ: modelRotate[2],
        scale: modelAsMercator.meterInMercatorCoordinateUnits()
    };
    // Three.js烟雾层
    const smokeLayer = {
        id: '3d-cube',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, gl) {
            this.map = map;
            this.scene = new THREE.Scene();
            this.camera = new THREE.Camera();

            // 创建立方体
            const geometry = new THREE.BoxGeometry(3, 3, 3); // 单位立方体
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000, // 红色
                transparent: true,
                opacity: 0.8
            });
            this.cube = new THREE.Mesh(geometry, material);

            // 缩放立方体到实际尺寸
            this.cube.scale.set(
                cubeConfig.size,
                cubeConfig.size,
                cubeConfig.size
            );

            this.scene.add(this.cube);

            // 渲染器设置
            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });
            this.renderer.autoClear = false;
        },

        render: function (gl, matrix) {
            const rotationX = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(1, 0, 0),
                cubeConfig.rotateX
            );
            const rotationY = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(0, 1, 0),
                cubeConfig.rotateY
            );
            const rotationZ = new THREE.Matrix4().makeRotationAxis(
                new THREE.Vector3(0, 0, 1),
                cubeConfig.rotateZ
            );
            // 更新立方体位置
            const m = new THREE.Matrix4().fromArray(matrix);
            const l = new THREE.Matrix4()
                .makeTranslation(
                    modelAsMercator.x,
                    modelAsMercator.y,
                    modelAsMercator.z
                ).scale(
                    new THREE.Vector3(
                        cubeConfig.scale,
                        -cubeConfig.scale,
                        cubeConfig.scale
                    )
                ).multiply(rotationX)
                .multiply(rotationY)
                .multiply(rotationZ);

            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
            this.map.triggerRepaint();
        }
    } as CustomLayerInterface
    mapR.addLayer(smokeLayer);
}

//纯three + mapbox 粒子
const threeParticle = () => {
    // 北京坐标(天安门附近)
    const beijingPosition: LngLatLike = [116.4, 39.9];

    // 转换为墨卡托坐标
    const modelAsMercator = mapboxgl.MercatorCoordinate.fromLngLat(
        beijingPosition,
        40 // 初始高度为0
    );

    // 粒子系统配置
    const particleConfig = {
        count: 5000, // 粒子数量
        size: 2, // 粒子大小
        radius: 100, // 分布半径(米)
        altitude: 100, // 基础高度(米)
        color: 0x00a8ff, // 粒子颜色(蓝色)
        speed: 0.5 // 动画速度
    };

    // 创建自定义图层
    const particleLayer = {
        id: 'particles',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, gl) {
            this.map = map;
            this.time = 0;

            // 初始化Three.js场景
            this.scene = new THREE.Scene();
            this.camera = new THREE.Camera();

            // 创建粒子几何体
            const particlesGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleConfig.count * 3);
            const colors = new Float32Array(particleConfig.count * 3);

            // 初始化粒子位置和颜色
            for (let i = 0; i < particleConfig.count; i++) {
                // 在球体内随机分布粒子
                const radius = Math.random() * particleConfig.radius;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;

                const x = radius * Math.sin(phi) * Math.cos(theta);
                const y = radius * Math.sin(phi) * Math.sin(theta);
                const z = radius * Math.cos(phi) + particleConfig.altitude;

                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;

                // 随机颜色变化
                colors[i * 3] = particleConfig.color >> 16 & 255 / 255;
                colors[i * 3 + 1] = particleConfig.color >> 8 & 255 / 255;
                colors[i * 3 + 2] = particleConfig.color & 255 / 255;
            }

            particlesGeometry.setAttribute(
                'position',
                new THREE.BufferAttribute(positions, 3)
            );
            particlesGeometry.setAttribute(
                'color',
                new THREE.BufferAttribute(colors, 3)
            );

            // 创建粒子材质
            const particlesMaterial = new THREE.PointsMaterial({
                size: particleConfig.size,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });

            // 创建粒子系统
            this.particles = new THREE.Points(
                particlesGeometry,
                particlesMaterial
            );
            this.scene.add(this.particles);

            // 设置渲染器
            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });
            this.renderer.autoClear = false;
        },

        render: function (gl, matrix) {
            // 更新时间用于动画
            this.time += 0.01 * particleConfig.speed;

            // 更新粒子位置(简单的上下浮动动画)
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < particleConfig.count; i++) {
                const zIndex = i * 3 + 2;
                positions[zIndex] += Math.sin(this.time + i * 0.1) * 0.5;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;

            // 计算变换矩阵
            const m = new THREE.Matrix4().fromArray(matrix);
            const l = new THREE.Matrix4()
                .makeTranslation(
                    modelAsMercator.x,
                    modelAsMercator.y,
                    modelAsMercator.z + (particleConfig.altitude * modelAsMercator.meterInMercatorCoordinateUnits())
                )
                .scale(new THREE.Vector3(
                    modelAsMercator.meterInMercatorCoordinateUnits(),
                    -modelAsMercator.meterInMercatorCoordinateUnits(),
                    modelAsMercator.meterInMercatorCoordinateUnits()
                ));

            // 设置相机投影矩阵
            this.camera.projectionMatrix = m.multiply(l);

            // 渲染
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
            this.map.triggerRepaint();
        }
    } as CustomLayerInterface

    mapR.addLayer(particleLayer);
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
    width: 10%;
    min-height: 50px;
    text-align: center;
    position: absolute;
    left: 1%;
    top: 4%;
    z-index: 9;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    padding: 15px 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .item {
        border: 1px solid sandybrown;
        height: 30px;
        padding: 4px;
        line-height: 30px;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 6px;
    }
}
</style>
