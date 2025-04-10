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
        demo1()
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
</script>
<style scoped lang='scss'>
@import './index.scss';
</style>