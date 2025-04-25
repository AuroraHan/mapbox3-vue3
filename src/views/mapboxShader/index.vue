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
        const randomAltitude = 1000 + Math.random() * 10000;

        const position = mapboxgl.MercatorCoordinate.fromLngLat(
            { lng: randomLng, lat: randomLat },
            randomAltitude
        );

        particles.push(position.x, position.y, position.z);
    }
    return particles;
};

class FixedParticles {
    id = 'smoke-layer';
    type = 'custom';
    renderingMode = '3d';
    program: WebGLProgram | null = null;
    aPos: number | null = null;
    buffer: WebGLBuffer | null = null;

    onAdd(map: mapboxgl.Map, gl: WebGL2RenderingContext) {
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

        //顶点着色器
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);

        //片元着色器
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
    }

    render(gl: WebGL2RenderingContext, matrix: Array<number>) {
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(
            gl.getUniformLocation(this.program!, "u_matrix"),
            false,
            matrix
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.aPos!);
        gl.vertexAttribPointer(this.aPos!, 3, gl.FLOAT, false, 0, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.POINTS, 0, 10000);
    }
}

const demo1 = () => {
    const pLayer = new FixedParticles()

    // 添加到地图
    mapR?.addLayer(pLayer);
}



//效果2 粒子发射器，不断向外发射

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


class SendParticles {
    id = 'particle-layer'
    type = 'custom'
    renderingMode = '3d'
    particles = [] as Particle[]     // 存储所有粒子
    lastEmitTime = 0                   // 上次发射时间
    centerPos = mapboxgl.MercatorCoordinate.fromLngLat(
        { lng: 116.4074, lat: 39.9042 }, // 北京中心
        0
    )
    map: mapboxgl.Map | null = null;
    program: WebGLProgram | null = null;
    aPos: number | null = null;
    buffer: WebGLBuffer | null = null;

    onAdd(map: mapboxgl.Map, gl: WebGL2RenderingContext) {
        this.map = map

        const vertexSource = `
            uniform mat4 u_matrix;
            attribute vec3 a_pos;
            varying vec3 v_pos;
            void main() {
                gl_PointSize = 5.0;
                v_pos = a_pos;
                gl_Position = u_matrix * vec4(a_pos, 1.0);
            }`;

        const fragmentSource = `
            precision mediump float;
            varying vec3 v_pos;
            void main() {
                float normalizedZ =step(0.003, v_pos.z); 
                gl_FragColor = vec4(1.0, normalizedZ,0.0, 1.0); // 黄色粒子
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
    }

    render(gl: WebGL2RenderingContext, matrix: Array<number>) {

        const now = Date.now();
        const timeSinceLastEmit = now - this.lastEmitTime;

        // 每100毫秒发射新粒子（可调整频率）
        if (timeSinceLastEmit > 100) {
            //每次发射的粒子数
            for (let i = 0; i < 20; i++) {
                this.particles.push(new Particle(
                    116.4074, 39.9042,  // 北京坐标
                    Math.random() * 250000 // 高度
                ));
            }
            this.lastEmitTime = now;
        }

        // 更新粒子位置，移除超出范围的
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isOutOfBounds(this.centerPos.x, this.centerPos.y, 0.01); // 0.1 是最大距离
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
            gl.getUniformLocation(this.program!, "u_matrix"),
            false,
            matrix
        );
        gl.enableVertexAttribArray(this.aPos!);
        gl.vertexAttribPointer(this.aPos!, 3, gl.FLOAT, false, 0, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.drawArrays(gl.POINTS, 0, this.particles.length);

        //不断刷新
        if (this.map)
            this.map.triggerRepaint();
    }
}
const demo2 = () => {
    //  mapboxgl.CustomLayerInterface;
    const sendP = new SendParticles()

    // 添加到地图
    mapR?.addLayer(sendP);
}




//效果3 扩散圆环
const demo3 = () => {
    const rippleLayer = {
        id: 'ripple-layer',
        type: 'custom',
        center: [116.4074, 39.9042], // 北京中心坐标
        radius: 0,                   // 当前半径（墨卡托坐标单位）
        maxRadius: 0.005,             // 最大半径（超出后消失）
        speed: 0.00005,               // 扩散速度
        segments: 64,                // 圆环分段数（越高越圆滑）

        onAdd: function (map, gl) {
            this.map = map;
            // 顶点着色器（绘制圆环）
            const vertexSource = `
                uniform mat4 u_matrix;
                attribute vec2 a_pos;
                void main() {
                    gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
                }
            `;

            // 片段着色器（红色渐变透明度）
            const fragmentSource = `
                precision mediump float;
                uniform float u_opacity;
                void main() {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, u_opacity); // 纯红色 + 动态透明度
                }
            `;

            // 编译着色器程序
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
            this.uOpacity = gl.getUniformLocation(this.program, "u_opacity");
            this.buffer = gl.createBuffer();
        },

        render: function (gl, matrix) {
            // 更新半径（扩散动画）
            this.radius += this.speed;

            // 重置条件：超出最大半径
            if (this.radius > this.maxRadius) {
                this.radius = 0;
            }

            // 生成当前半径的圆环顶点
            const center = mapboxgl.MercatorCoordinate.fromLngLat(
                { lng: this.center[0], lat: this.center[1] },
                0
            );
            // 生成带厚度的圆环顶点（内外圈）
            const thickness = 0.0003; // 线宽
            const vertices = [];
            for (let i = 0; i <= this.segments; i++) {
                const angle = (i % this.segments) * Math.PI * 2 / this.segments;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                // 内圈
                vertices.push(
                    center.x + (this.radius - thickness) * cos,
                    center.y + (this.radius - thickness) * sin
                );

                // 外圈
                vertices.push(
                    center.x + (this.radius + thickness) * cos,
                    center.y + (this.radius + thickness) * sin
                );
            }


            // 绑定数据并绘制
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

            gl.useProgram(this.program);
            gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "u_matrix"), false, matrix);
            gl.uniform1f(this.uOpacity, 1.0 - this.radius / this.maxRadius);

            gl.enableVertexAttribArray(this.aPos);
            gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);

            // 如需平滑边缘，启用 gl.enable(gl.BLEND) 并设置混合函数：
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            // 绘制为三角形带
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length / 2);

            //不断刷新
            if (this.map)
                this.map.triggerRepaint();
        }
    } as mapboxgl.CustomLayerInterface;

    // 添加到地图
    mapR.addLayer(rippleLayer);
}
</script>
<style scoped lang='scss'>
@import './index.scss';
</style>