<template>
    <div id="map" class="map"></div>
    <pre
        class="lonlat">经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}</pre>
    <div class="box">

        <div class="item" @click="baseBox">加载基础正方体</div>
        <div class="item" @click="createParticle">加载基础粒子</div>
        <div class="item" @click="createSmoke">烟雾扩散</div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as THREE from 'three';
import lodash from 'lodash'
import { useMapbox } from '../../hooks/useMapBox'
import * as Turf from '@turf/turf'
import mapboxgl, { CustomLayerInterface, LngLatLike, Map, } from 'mapbox-gl';

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

//创建烟雾模型
class Smoke {
    id = 'smoke-layer';
    type = 'custom';
    renderingMode = '3d';

    // 烟雾发射器配置
    smokeConfig = {
        emissionRate: 30, // 每秒发射粒子数
        maxParticles: 2000, // 最大粒子数
        particleSize: 1, // 粒子大小
        lifeTime: 10, // 粒子生命周期(秒)
        spread: 0.2, // 扩散范围
        windDirection: [0.8, 0.1], // 风向向量[x,y]
        windSpeed: 0.5, // 风速
        riseSpeed: 0.3, // 上升速度
        startColor: [0.8, 0.8, 0.8], // 起始颜色(灰色)
        endColor: [0.2, 0.2, 0.2, 0] // 结束颜色(淡出)
    }

    // 北京烟雾源位置(天安门附近)
    smokeSource = {
        lnglat: [116.4, 39.9] as LngLatLike,
        altitude: 50 // 起始高度50米
    }

    // 转换为墨卡托坐标
    sourceMercator = mapboxgl.MercatorCoordinate.fromLngLat(
        this.smokeSource.lnglat,
        this.smokeSource.altitude
    );

    particles: Array<THREE.Mesh> = []
    lastEmissionTime = 0
    scene: THREE.Scene;
    camera: THREE.Camera;
    particleGroup: THREE.Group;
    sourceMarker: THREE.Mesh | null = null;
    renderer: THREE.WebGLRenderer | null = null;
    map: Map | null = null;

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();

        // 创建粒子容器
        this.particleGroup = new THREE.Group();
        this.scene.add(this.particleGroup);
    }

    onAdd(map: Map, gl: WebGL2RenderingContext) {
        this.map = map;
        // 烟雾源标记(红色点)
        const sourceGeometry = new THREE.SphereGeometry(2, 16, 16);
        const sourceMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.sourceMarker = new THREE.Mesh(sourceGeometry, sourceMaterial);
        this.scene.add(this.sourceMarker);

        // 设置渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });
        this.renderer.autoClear = false;
    }

    render(gl: WebGL2RenderingContext, matrix: Array<number>) {
        const currentTime = performance.now() / 1000; // 当前时间(秒)
        const deltaTime = currentTime - this.lastEmissionTime;

        // 发射新粒子
        if (deltaTime >= 1 / this.smokeConfig.emissionRate) {
            this.emitParticle(currentTime);
            this.lastEmissionTime = currentTime;
        }

        // 更新现有粒子
        this.updateParticles(currentTime);

        // 清理死亡粒子
        this.cleanParticles();

        // 计算变换矩阵
        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
            .makeTranslation(
                this.sourceMercator.x,
                this.sourceMercator.y,
                this.sourceMercator.z
            )
            .scale(new THREE.Vector3(
                this.sourceMercator.meterInMercatorCoordinateUnits(),
                -this.sourceMercator.meterInMercatorCoordinateUnits(),
                this.sourceMercator.meterInMercatorCoordinateUnits()
            ));

        // 设置相机投影矩阵
        this.camera.projectionMatrix = m.multiply(l);

        // 渲染
        this.renderer?.resetState();
        this.renderer?.render(this.scene, this.camera);
        this.map?.triggerRepaint();
    }

    //发射粒子
    emitParticle(currentTime: number) {
        if (this.particles.length >= this.smokeConfig.maxParticles) return;

        // 创建新粒子
        const geometry = new THREE.SphereGeometry(
            this.smokeConfig.particleSize * (0.2 + Math.random() * 0.4),
            16, 16
        );

        // 初始颜色
        const color = new THREE.Color(
            this.smokeConfig.startColor[0],
            this.smokeConfig.startColor[1],
            this.smokeConfig.startColor[2]
        );

        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            depthTest: false
        });

        const particle = new THREE.Mesh(geometry, material);

        // 初始位置(添加一些随机扩散)
        particle.position.set(
            (Math.random() - 0.5) * this.smokeConfig.spread * 10,
            (Math.random() - 0.5) * this.smokeConfig.spread * 10,
            (Math.random() - 0.5) * this.smokeConfig.spread * 2
        );

        // 粒子属性
        particle.userData = {
            bornTime: currentTime,
            lifeTime: this.smokeConfig.lifeTime * (0.8 + Math.random() * 0.4),
            velocity: new THREE.Vector3(
                this.smokeConfig.windDirection[0] * this.smokeConfig.windSpeed,
                this.smokeConfig.windDirection[1] * this.smokeConfig.windSpeed,
                this.smokeConfig.riseSpeed
            ),
            startColor: new THREE.Color().setRGB(this.smokeConfig.startColor[0], this.smokeConfig.startColor[1], this.smokeConfig.startColor[2]),
            endColor: new THREE.Color().setRGB(this.smokeConfig.endColor[0], this.smokeConfig.endColor[1], this.smokeConfig.endColor[2])
        };

        this.particleGroup.add(particle);
        this.particles.push(particle);
    }

    //更新粒子
    updateParticles(currentTime: number) {
        const particles = this.particles;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const age = currentTime - p.userData.bornTime;
            const lifeProgress = age / p.userData.lifeTime;

            if (lifeProgress >= 1) continue; // 已死亡粒子跳过

            // 更新位置
            p.position.x += p.userData.velocity.x * 0.016; // 假设60fps
            p.position.y += p.userData.velocity.y * 0.016;
            p.position.z += p.userData.velocity.z * 0.016;

            // 更新大小(逐渐变大)
            const scale = 1 + lifeProgress * 2;
            p.scale.set(scale, scale, scale);

            // 更新颜色和透明度
            p.material.color.lerpColors(
                p.userData.startColor,
                p.userData.endColor,
                lifeProgress
            );
            p.material.opacity = 0.8 * (1 - lifeProgress);
        }
    }

    //清除粒子
    cleanParticles() {
        const currentTime = performance.now() / 1000;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const age = currentTime - p.userData.bornTime;

            if (age >= p.userData.lifeTime) {
                this.particleGroup.remove(p);
                p.geometry.dispose();
                p.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }
}

const createSmoke = () => {
    const aa = new Smoke()
    mapR.addLayer(aa as CustomLayerInterface)
}

class Box {
    id = 'box-layer';
    type = 'custom';
    renderingMode = '3d';
    scene: THREE.Scene;
    camera: THREE.Camera;
    map: Map | null = null;

    modelRotate = [Math.PI / 2, 0, 0];
    // 坐标转换
    modelAsMercator = mapboxgl.MercatorCoordinate.fromLngLat(
        [116.4, 39.9],
        150
    );
    // 烟雾参数配置
    cubeConfig = {
        position: [116.4, 39.9], // 经纬度
        size: 100, // 边长(米)
        altitude: 0, // 地面高度
        rotateX: this.modelRotate[0],
        rotateY: this.modelRotate[1],
        rotateZ: this.modelRotate[2],
        scale: this.modelAsMercator.meterInMercatorCoordinateUnits()
    };
    cube: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap> | null = null;
    renderer: THREE.WebGLRenderer | null = null;

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
    }

    onAdd(map: Map, gl: WebGL2RenderingContext) {
        this.map = map;

        // 创建立方体
        const geometry = new THREE.BoxGeometry(1, 1, 1); // 单位立方体
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000, // 红色
            transparent: true,
            opacity: 0.8
        });
        this.cube = new THREE.Mesh(geometry, material);

        // 缩放立方体到实际尺寸
        this.cube.scale.set(
            this.cubeConfig.size,
            this.cubeConfig.size,
            this.cubeConfig.size
        );

        this.scene.add(this.cube);

        // 渲染器设置
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });
        this.renderer.autoClear = false;
    }

    render(gl: WebGL2RenderingContext, matrix: Array<number>) {
        const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            this.cubeConfig.rotateX
        );
        const rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0),
            this.cubeConfig.rotateY
        );
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            this.cubeConfig.rotateZ
        );
        // 更新立方体位置
        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
            .makeTranslation(
                this.modelAsMercator.x,
                this.modelAsMercator.y,
                this.modelAsMercator.z
            ).scale(
                new THREE.Vector3(
                    this.cubeConfig.scale,
                    -this.cubeConfig.scale,
                    this.cubeConfig.scale
                )
            ).multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);
        this.renderer?.resetState();
        this.renderer?.render(this.scene, this.camera);
        this.map?.triggerRepaint();
    }
}
//正方体
const baseBox = () => {
    const a = new Box()
    mapR.addLayer(a as CustomLayerInterface);
}


class MyParticle {
    id = 'particle-layer';
    type = 'custom';
    renderingMode = '3d';
    // 北京坐标(天安门附近)
    beijingPosition: LngLatLike = [116.4, 39.9];

    map: Map | null = null;
    time: number;
    scene: THREE.Scene;
    camera: THREE.Camera;
    particles: THREE.Points | null = null;
    renderer: THREE.WebGLRenderer | null = null;

    // 转换为墨卡托坐标
    modelAsMercator = mapboxgl.MercatorCoordinate.fromLngLat(
        this.beijingPosition,
        40 // 初始高度为0
    );

    // 粒子系统配置
    particleConfig = {
        count: 5000, // 粒子数量
        size: 2, // 粒子大小
        radius: 100, // 分布半径(米)
        altitude: 100, // 基础高度(米)
        color: 0x00a8ff, // 粒子颜色(蓝色)
        speed: 0.5 // 动画速度
    };



    constructor() {
        this.time = 0;

        // 初始化Three.js场景
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
    }


    onAdd(map: Map, gl: WebGL2RenderingContext) {
        this.map = map;

        // 创建粒子几何体
        const particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleConfig.count * 3);
        const colors = new Float32Array(this.particleConfig.count * 3);

        // 初始化粒子位置和颜色
        for (let i = 0; i < this.particleConfig.count; i++) {
            // 在球体内随机分布粒子
            const radius = Math.random() * this.particleConfig.radius;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi) + this.particleConfig.altitude;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // 随机颜色变化
            colors[i * 3] = this.particleConfig.color >> 16 & 255 / 255;
            colors[i * 3 + 1] = this.particleConfig.color >> 8 & 255 / 255;
            colors[i * 3 + 2] = this.particleConfig.color & 255 / 255;
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
            size: this.particleConfig.size,
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
    }

    render(gl: WebGL2RenderingContext, matrix: Array<number>) {
        // 更新时间用于动画
        this.time += 0.01 * this.particleConfig.speed;

        // 更新粒子位置(简单的上下浮动动画)
        const positions = this.particles!.geometry.attributes.position.array;
        for (let i = 0; i < this.particleConfig.count; i++) {
            const zIndex = i * 3 + 2;
            positions[zIndex] += Math.sin(this.time + i * 0.1) * 0.5;
        }
        this.particles!.geometry.attributes.position.needsUpdate = true;

        // 计算变换矩阵
        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
            .makeTranslation(
                this.modelAsMercator.x,
                this.modelAsMercator.y,
                this.modelAsMercator.z + (this.particleConfig.altitude * this.modelAsMercator.meterInMercatorCoordinateUnits())
            )
            .scale(new THREE.Vector3(
                this.modelAsMercator.meterInMercatorCoordinateUnits(),
                -this.modelAsMercator.meterInMercatorCoordinateUnits(),
                this.modelAsMercator.meterInMercatorCoordinateUnits()
            ));

        // 设置相机投影矩阵
        this.camera.projectionMatrix = m.multiply(l);

        // 渲染
        this.renderer?.resetState();
        this.renderer?.render(this.scene, this.camera);
        this.map?.triggerRepaint();
    }
}
//粒子模式
const createParticle = () => {
    const particle = new MyParticle()
    mapR.addLayer(particle as CustomLayerInterface)
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
