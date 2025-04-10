<!--  -->
<template>
    <div id="map" class="map"></div>
</template>

<script setup lang='ts'>
import { reactive, toRefs, onBeforeMount, onMounted } from 'vue'
import { useMapbox } from '../../hooks/useMapBox'
import mapboxgl from 'mapbox-gl';

let mapR: mapboxgl.Map;

const { getMap } = useMapbox({ container: 'map', isOffline: false })


onMounted(() => {
    baseConfig()
})

const baseConfig = () => {
    mapR = getMap()!

    mapR.on('load', () => {
        demo2()
    })
}

// 随机生成粒子数据
const generateRandomParticles = (count: number) => {
    const particles: any[] = [];

    for (let i = 0; i < count; i++) {
        const randomLng = 116.4074 + Math.random() * 0.1 - 0.05; // 随机经度
        const randomLat = 39.9042 + Math.random() * 0.1 - 0.05; // 随机纬度
        const randomAltitude = 10000 + Math.random() * 10000;

        const position = mapboxgl.MercatorCoordinate.fromLngLat(
            { lng: randomLng, lat: randomLat },
            randomAltitude
        );

        particles.push(position.x, position.y, position.z);
    }
    return particles;
};

const demo1 = () => {
    const particleLayer = {
        id: 'particle-layer',
        type: 'custom',
        onAdd: function (map, gl) {
            console.log(this, 'kkkk');
            const vertexSource = `
            uniform mat4 u_matrix;
            attribute vec3 a_pos;
            void main() {
                gl_PointSize = 5.0;
                gl_Position = u_matrix * vec4(a_pos, 1.0);
            }`;

            const fragmentSource = `
            void main() {
                gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); // 黄色粒子
            }`;

            const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
            gl.shaderSource(vertexShader, vertexSource);
            gl.compileShader(vertexShader);

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
            gl.shaderSource(fragmentShader, fragmentSource);
            gl.compileShader(fragmentShader);

            this.program = gl.createProgram()!;
            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);

            this.aPos = gl.getAttribLocation(this.program, "a_pos");

            //生成粒子数
            const particlePositions = generateRandomParticles(10000);

            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(particlePositions),
                gl.STATIC_DRAW
            );
        },

        render: function (gl, matrix) {
            gl.useProgram(this.program);
            gl.uniformMatrix4fv(
                gl.getUniformLocation(this.program, "u_matrix"),
                false,
                matrix
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.enableVertexAttribArray(this.aPos);
            gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.POINTS, 0, 10000);

        }
    } as mapboxgl.CustomLayerInterface;

    // 添加到地图
    mapR?.addLayer(particleLayer);
}

const demo2 = () => {
    const particleLayer = {
        id: 'particle-layer',
        type: 'custom',
        particles: [] as Particle[],       // 存储所有粒子
        lastEmitTime: 0,                   // 上次发射时间
        centerPos: mapboxgl.MercatorCoordinate.fromLngLat(
            { lng: 116.4074, lat: 39.9042 }, // 北京中心
            0
        ),
        onAdd: function (map, gl) {
            this.map = map
            const vertexSource = `
            uniform mat4 u_matrix;
            attribute vec3 a_pos;
            void main() {
                gl_PointSize = 5.0;
                gl_Position = u_matrix * vec4(a_pos, 1.0);
            }`;

            const fragmentSource = `
            void main() {
                gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); // 黄色粒子
            }`;

            const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
            gl.shaderSource(vertexShader, vertexSource);
            gl.compileShader(vertexShader);

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
            gl.shaderSource(fragmentShader, fragmentSource);
            gl.compileShader(fragmentShader);

            this.program = gl.createProgram()!;
            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);

            this.aPos = gl.getAttribLocation(this.program, "a_pos");


            this.particles = [];
            this.lastEmitTime = Date.now();
            this.buffer = gl.createBuffer();
        },

        render: function (gl, matrix) {
            const now = Date.now();
            const timeSinceLastEmit = now - this.lastEmitTime;

            // 每100毫秒发射新粒子（可调整频率）
            if (timeSinceLastEmit > 100) {
                //每次发射的粒子数
                for (let i = 0; i < 20; i++) {
                    this.particles.push(new Particle(
                        116.4074, 39.9042,  // 北京坐标
                        Math.random() * 25000 // 高度
                    ));
                }
                this.lastEmitTime = now;
            }

            // 更新粒子位置，移除超出范围的
            this.particles = this.particles.filter(p => {
                p.update();
                return !p.isOutOfBounds(this.centerPos.x, this.centerPos.y, 0.1); // 0.1 是最大距离
            });

            // 将粒子数据写入缓冲区
            const particlePositions = new Float32Array(this.particles.length * 3);
            this.particles.forEach((p, i) => {
                particlePositions[i * 3] = p.x;
                particlePositions[i * 3 + 1] = p.y;
                particlePositions[i * 3 + 2] = p.z;
            });

            // 渲染
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, particlePositions, gl.DYNAMIC_DRAW); // 改为 DYNAMIC_DRAW

            gl.useProgram(this.program);
            gl.uniformMatrix4fv(
                gl.getUniformLocation(this.program, "u_matrix"),
                false,
                matrix
            );
            gl.enableVertexAttribArray(this.aPos);
            gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.POINTS, 0, this.particles.length);

            //不断刷新
            if (this.map)
                this.map.triggerRepaint();
        }
    } as mapboxgl.CustomLayerInterface;

    // 添加到地图
    mapR?.addLayer(particleLayer);
}

class Particle {
    x: number;  // 墨卡托坐标 x
    y: number;  // 墨卡托坐标 y
    z: number;  // 墨卡托坐标 z
    vx: number; // x 方向速度
    vy: number; // y 方向速度
    vz: number; // z 方向速度

    constructor(lng: number, lat: number, altitude: number) {
        const pos = mapboxgl.MercatorCoordinate.fromLngLat(
            { lng, lat },
            altitude
        );
        this.x = pos.x;
        this.y = pos.y;
        this.z = pos.z;

        // 随机初速度（向外扩散）
        const speed = 0.0000001 + Math.random() * 0.0001; //控制速度
        const angle = Math.random() * Math.PI / 2; // 随机方向
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.vz = 0; // 可改为向上飞行（如 this.vz = 0.0001）
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
    }

    isOutOfBounds(centerX: number, centerY: number, maxDistance: number) {
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        return Math.sqrt(dx * dx + dy * dy) > maxDistance;
    }
}
</script>
<style scoped lang='scss'>
@import './index.scss';
</style>