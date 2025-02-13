<template>
    <div id="map">
    </div>
    <div class="container">
        <div class="map-item">
            粒子效果开启
            <el-switch v-model="particFlag" @change="controlPartic" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import mapbox, { CustomLayerInterface } from 'mapbox-gl';
import { useMapbox } from '../../hooks/useMapBox'
import { removeLayerAndSource } from '../../utils/mapTools'

let mapR: mapboxgl.Map | null = null;
const { getMap } = useMapbox({ container: 'map' })

onMounted(() => {
    mapR = getMap()
})



//控制粒子
const particFlag = ref(false)

//打开和关闭操作
const controlPartic = () => {
    if (particFlag.value) {
        lonPartic()
    } else {
        removeLayerAndSource(mapR!, 'particle-layer', 1)
    }
}

//经度上进行浮动
const lonPartic = () => {
    const particleLayer = {
        id: 'particle-layer',
        type: 'custom',
        onAdd: function (map, gl) {
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

            this.aPos = gl.getAttribLocation(this.program, 'a_pos');

            // 生成粒子数据
            const generateRandomParticles = (count) => {
                const particles: any[] = [];
                const beijing = mapbox.MercatorCoordinate.fromLngLat({ lng: 116.4074, lat: 39.9042 });

                for (let i = 0; i < count; i++) {
                    const randomLng = 116.4074 + Math.random() * 0.1 - 0.05; // 随机经度
                    const randomLat = 39.9042 + Math.random() * 0.1 - 0.05; // 随机纬度
                    const randomAltitude = 20000 + Math.random() * 15000;

                    const position = mapbox.MercatorCoordinate.fromLngLat(
                        { lng: randomLng, lat: randomLat },
                        randomAltitude
                    );

                    particles.push(position.x, position.y, position.z);
                }
                return particles;
            };

            this.particlePositions = generateRandomParticles(1000);

            // 创建缓冲区并绑定数据
            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.particlePositions), gl.STATIC_DRAW);

            // 记录时间，用于控制粒子在经度方向的移动
            this.time = 0;

            // 使用 requestAnimationFrame 动态更新粒子
            const animateParticles = () => {
                map.triggerRepaint(); // 强制刷新图层
                requestAnimationFrame(animateParticles);
            };

            // 启动动画
            animateParticles();
        },

        render: function (gl, matrix) {
            gl.useProgram(this.program);
            gl.uniformMatrix4fv(
                gl.getUniformLocation(this.program, 'u_matrix'),
                false,
                matrix
            );

            // 更新粒子位置，使其沿经度方向移动
            const timeStep = 0.001; // 时间步长
            this.time += timeStep;

            const movingAmplitude = 0.005; // 经度移动的幅度（单位：度）
            const frequency = 1; // 频率

            // 更新粒子的x轴位置（经度方向）
            const updatedPositions: any[] = [];
            for (let i = 0; i < this.particlePositions.length; i += 3) {
                let x = this.particlePositions[i]; // 经度
                const y = this.particlePositions[i + 1]; // 纬度
                const z = this.particlePositions[i + 2]; // 高度

                // 使粒子在经度方向上沿着正弦波移动
                const newX = x + Math.sin(this.time * frequency + i * 0.01) * movingAmplitude;

                updatedPositions.push(newX, y, z);
            }

            // 更新粒子缓冲区数据
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(updatedPositions), gl.STATIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.enableVertexAttribArray(this.aPos);
            gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.POINTS, 0, this.particlePositions.length / 3); // 使用粒子数量
        }
    } as mapboxgl.CustomLayerInterface;

    // 添加到地图
    mapR?.addLayer(particleLayer);
}

</script>

<style scoped>
#map {
    height: 100vh;
}

.container {
    z-index: 9;
    width: 260px;
    height: 40%;
    position: absolute;
    right: 3%;
    top: 3%;
    background-color: rgba(188, 242, 224, 0.7);
    border-radius: 4px;
    padding: 10px 2px;
}

.map-item {
    line-height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-around;
}
</style>