<template>
    <div id="map">
    </div>
    <div class="container">
        <div class="map-item">
            测试地图1<el-switch v-model="map1" @change="loadParticHight" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import mapbox, { CustomLayerInterface } from 'mapbox-gl';
import { latLonToWebMercator, webMercatorToLatLon } from '@/utils/mapTools';

let mapR: mapboxgl.Map | null = null;

onMounted(() => {
    initMap()
})

onUnmounted(() => {
    mapR?.remove()
    mapR = null;
})

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
    map.on('load', () => {

    })

    map.on('click', (e) => {
        console.log(e, 'kkk');
        // const nullIsland = new mapbox.MercatorCoordinate(30000, 30000, 0);
        // console.log(nullIsland);

        //坐标数据互相转换
        const res = latLonToWebMercator(e.lngLat.lng, e.lngLat.lat)
        console.log(res);
        const res1 = webMercatorToLatLon(res.x, res.y)
        console.log(res1);
    })
}

//
const map1 = ref(false)

//画出三角形
const loadWebGl = () => {
    const highlightLayer = {
        id: 'highlight',
        type: 'custom',
        // https://docs.mapbox.com/mapbox-gl-js/api/#styleimageinterface#onadd
        onAdd: function (map, gl) {
            // create GLSL source for vertex shader
            const vertexSource = `
                uniform mat4 u_matrix;
                attribute vec3 a_pos;
                void main() {
                    gl_Position = u_matrix * vec4(a_pos, 1.0);
                }`;

            // create GLSL source for fragment shader
            const fragmentSource = `
                void main() {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5);
                }`;

            // create a vertex shader
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader!, vertexSource);
            gl.compileShader(vertexShader!);

            // create a fragment shader
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader!, fragmentSource);
            gl.compileShader(fragmentShader!);

            // link the two shaders into a WebGL program
            this.program = gl.createProgram();
            gl.attachShader(this.program, vertexShader!);
            gl.attachShader(this.program, fragmentShader!);
            gl.linkProgram(this.program);

            this.aPos = gl.getAttribLocation(this.program, 'a_pos');

            // define vertices of the triangle to be rendered in the custom style layer
            const helsinki = mapbox.MercatorCoordinate.fromLngLat({
                lng: 25.004,
                lat: 60.239
            }, 30000);
            const berlin = mapbox.MercatorCoordinate.fromLngLat({
                lng: 13.403,
                lat: 52.562
            }, 50000);
            const kyiv = mapbox.MercatorCoordinate.fromLngLat({
                lng: 30.498,
                lat: 50.541
            }, 20000);

            // create and initialize a WebGLBuffer to store vertex and color data
            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([
                    helsinki.x,
                    helsinki.y,
                    helsinki.z,
                    berlin.x,
                    berlin.y,
                    berlin.z,
                    kyiv.x,
                    kyiv.y,
                    kyiv.z
                ]),
                gl.STATIC_DRAW
            );
        },

        // method fired on each animation frame
        // https://docs.mapbox.com/mapbox-gl-js/api/#map.event:render
        render: function (gl, matrix) {
            gl.useProgram(this.program);
            gl.uniformMatrix4fv(
                gl.getUniformLocation(this.program, 'u_matrix'),
                false,
                matrix
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.enableVertexAttribArray(this.aPos);
            gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
        }
    } as CustomLayerInterface;

    mapR?.addLayer(highlightLayer);
}

//创建粒子效果
const loadPartic = () => {
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
            const generateRandomParticles = (count: number) => {
                const particles: any[] = [];
                const beijing = mapbox.MercatorCoordinate.fromLngLat({ lng: 116.4074, lat: 39.9042 });

                for (let i = 0; i < count; i++) {
                    const randomLng = 116.4074 + Math.random() * 0.1 - 0.05;
                    const randomLat = 39.9042 + Math.random() * 0.1 - 0.05;
                    const randomAltitude = 10000 + Math.random() * 40000;

                    const position = mapbox.MercatorCoordinate.fromLngLat(
                        { lng: randomLng, lat: randomLat },
                        randomAltitude
                    );

                    particles.push(position.x, position.y, position.z);
                }
                return particles;
            };

            const particlePositions = generateRandomParticles(1000);

            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particlePositions), gl.STATIC_DRAW);
        },

        render: function (gl, matrix) {
            gl.useProgram(this.program);
            gl.uniformMatrix4fv(
                gl.getUniformLocation(this.program, 'u_matrix'),
                false,
                matrix
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.enableVertexAttribArray(this.aPos);
            gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.POINTS, 0, 1000);
        }
    } as mapboxgl.CustomLayerInterface;

    // 添加到地图
    mapR?.addLayer(particleLayer);
}

//根据不同高度创建粒子效果
const loadParticHight = () => {
    const particleLayer = {
        id: 'particle-layer',
        type: 'custom',
        onAdd: function (map, gl) {
            const vertexSource = `
            uniform mat4 u_matrix;
            attribute vec3 a_pos;
            void main() {
                gl_PointSize = 15.0;
                gl_Position = u_matrix * vec4(a_pos, 1.0);
            }`;

            const fragmentSource = `
            void main() {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 0.9);
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
            console.log(this.aPos)
            const generateRandomParticles = (count: number) => {
                const particles: any[] = [];
                for (let i = 0; i < count; i++) {
                    const randomLng = 116.4074 + Math.random() * 0.1 - 0.05;
                    const randomLat = 39.9042 + Math.random() * 0.1 - 0.05;
                    const randomAltitude = 10000 + Math.random() * 40000;

                    const position = mapbox.MercatorCoordinate.fromLngLat(
                        { lng: randomLng, lat: randomLat },
                        randomAltitude
                    );
                    particles.push(position.x, position.y, position.z);
                }
                return particles;
            };

            const particlePositions = generateRandomParticles(1000);
            this.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particlePositions), gl.STATIC_DRAW);
        },

        render: function (gl, matrix) {
            gl.useProgram(this.program);
            gl.uniformMatrix4fv(
                gl.getUniformLocation(this.program, 'u_matrix'),
                false,
                matrix
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.enableVertexAttribArray(this.aPos);
            gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.POINTS, 0, 1000);
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
    width: 300px;
    height: 60%;
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