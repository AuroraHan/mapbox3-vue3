<template>
    <div id="map">
    </div>
    <div class="container">
        <div class="map-item">
            <div>粒子效果开启</div>
            <el-switch v-model="particFlag" @change="controlPartic" />
        </div>

        <div class="map-item">
            <div>蚂蚁线效果</div>
            <el-switch v-model="antFlag" @change="controlAnt" />
        </div>

        <div class="map-item">
            <div>旋转效果</div>
            <el-switch v-model="rotateFlag" @change="addRotateCamera" />
        </div>

        <div class="map-item">
            <div>聚合效果</div>
            <el-switch v-model="clusterFlag" @change="addClusterHandle" />
        </div>

        <div class="map-item">
            <div>风场加载</div>
            <el-switch v-model="windFlag" @change="addWindHandle" />
        </div>

        <div class="map-item">
            <div>特征值属性</div>
            <el-switch v-model="stateFlag" @change="stateHandle" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import mapbox, { CustomLayerInterface } from 'mapbox-gl';
import { useMapbox } from '../../hooks/useMapBox'
import { removeLayerAndSource, flyTo } from '../../utils/mapTools'
import { antGeojson, windList } from '../../assets/const'
import { addWindIcon } from './utils'

let mapR: mapboxgl.Map | null = null;
const { getMap } = useMapbox({ container: 'map' })

onMounted(() => {
    mapR = getMap()
    proConfig()
})

//预加载功能
const proConfig = () => {
    mapR?.on('load', () => {
        addPoint()
        addWindIcon(mapR!)
        aa()
    })
}

//添加点图层
const addPoint = () => {
    mapR?.addSource('china', {
        type: 'geojson',
        data: './geojson/shandong.geojson',
    })

    mapR?.addLayer({
        id: 'china',
        source: 'china',
        type: 'line',
        minzoom: 2,
        maxzoom: 18,
        'paint': {
            'line-color': '#ff0000', // blue color fill
        }
    })
}

//控制粒子
const particFlag = ref(false)

//打开和关闭操作
const controlPartic = () => {
    if (particFlag.value) {
        flyTo(mapR!, [116.3, 39.8], 8)
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

//蚂蚁线效果
const antFlag = ref(false)
//控制显示和隐藏
const controlAnt = () => {
    if (antFlag.value) {
        addAntLine()
    } else {
        removeLayerAndSource(mapR!, 'line-background', 1)
        removeLayerAndSource(mapR!, 'line-dashed', 1)
        removeLayerAndSource(mapR!, 'ant-line', 0)
    }
}

//添加蚂蚁线
const addAntLine = () => {
    flyTo(mapR!, [113.9, 35.2], 6)

    //数据中的顺序控制蚂蚁线的流向
    mapR?.addSource('ant-line', {
        type: 'geojson',
        data: antGeojson as GeoJSON.GeoJSON
    });

    //底层线路背景
    mapR?.addLayer({
        type: 'line',
        source: 'ant-line',
        id: 'line-background',
        paint: {
            'line-color': 'yellow',
            'line-width': 6,
            'line-opacity': 0.4
        }
    });

    //不断更新此动态蚂蚁线
    mapR?.addLayer({
        type: 'line',
        source: 'ant-line',
        id: 'line-dashed',
        paint: {
            'line-color': 'red',
            'line-width': 6,
            'line-dasharray': [0, 4, 3]
        }
    });

    //蚂蚁线配置
    const dashArraySequence = [
        [0, 4, 3],
        [0.5, 4, 2.5],
        [1, 4, 2],
        [1.5, 4, 1.5],
        [2, 4, 1],
        [2.5, 4, 0.5],
        [3, 4, 0],
        [0, 0.5, 3, 3.5],
        [0, 1, 3, 3],
        [0, 1.5, 3, 2.5],
        [0, 2, 3, 2],
        [0, 2.5, 3, 1.5],
        [0, 3, 3, 1],
        [0, 3.5, 3, 0.5]
    ];

    let step = 0;

    function animateDashArray(timestamp) {
        let newStep = parseInt(
            (timestamp / 100) % dashArraySequence.length
        );
        console.log(newStep);


        if (newStep !== step) {
            mapR?.setPaintProperty(
                'line-dashed',
                'line-dasharray',
                dashArraySequence[step]
            );
            step = newStep;
        }

        requestAnimationFrame(animateDashArray);
    }

    // 开启效果
    animateDashArray(0);
}

//添加旋转效果
const rotateFlag = ref(false)
let rotateC;
const addRotateCamera = () => {
    if (rotateFlag.value) {
        mapR?.setPitch(45)
        mapR?.flyTo({ center: [112, 31], zoom: 15 })
        setTimeout(() => {
            rotateCamera(0)
        }, 4000);
    } else {
        cancelAnimationFrame(rotateC)
    }
}

//旋转相机方法
const rotateCamera = (timestamp) => {
    // clamp the rotation between 0 -360 degrees
    // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
    mapR?.rotateTo((timestamp / 500) % 360, { duration: 0 });
    // Request the next frame of the animation.
    rotateC = requestAnimationFrame(rotateCamera);
}


const clusterFlag = ref(false)
const addClusterHandle = () => {
    if (clusterFlag.value) {
        addCluster()
    } else {
        removeLayerAndSource(mapR!, 'clusters', 1)
        removeLayerAndSource(mapR!, 'cluster-count', 1)
        removeLayerAndSource(mapR!, 'unclustered-point', 1)
        removeLayerAndSource(mapR!, 'earthquakes', 0)
    }
}

//添加聚合效果
const addCluster = () => {
    //添加数据源
    mapR?.addSource('earthquakes', {
        type: 'geojson',
        data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson',
        cluster: true,
        clusterMaxZoom: 14, // 最大聚类缩放级别，超过则显示单个点
        clusterRadius: 50, // 聚类半径（像素，默认50）
        // clusterMinPoints: 2, // 形成聚类的最小点数（可选）
        // clusterProperties: { // 自定义聚合属性（可选）
        //     'sum_field': ['+', ['get', 'field_name']] // 累加字段值
        // }
    });

    //聚合时的图标信息
    mapR?.addLayer({
        id: 'clusters',
        type: 'symbol',
        source: 'earthquakes',
        filter: ['has', 'point_count'],
        layout: {
            'icon-image': 'rocket',
            'icon-size': [
                'step',
                ['get', 'point_count'], // 根据点数调整图标大小
                1, 100,   // <10 点：图标大小为 0.5
                1.6, 750,   // 10-50 点：图标大小为 0.8
                2.2        // >50 点：图标大小为 1.2
            ],
            'icon-allow-overlap': true // 允许图标重叠
        },
        paint: {
            'icon-opacity': 1 // 图标透明度
        }

    });

    //记录聚合时数量大小
    mapR?.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'earthquakes',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, 1.6],
        },
        paint: {
            // 'text-color': '#ffffff'
        }
    });

    //单个不聚合时的显示
    mapR?.addLayer({
        id: 'unclustered-point',
        type: 'symbol',
        source: 'earthquakes',
        filter: ['!', ['has', 'point_count']],
        layout: {
            'icon-image': 'rocket',
            'icon-size': 1.5
        },
        // paint: {
        //     'circle-color': '#11b4da',
        //     'circle-radius': 4,
        //     'circle-stroke-width': 1,
        //     'circle-stroke-color': '#fff'
        // }
    });


    //对于聚合点的监听事件
    mapR?.on('click', 'clusters', (e) => {
        const features = mapR?.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });

        //如果不存在之间返回
        if (!features?.length) return

        //获取源数据
        const source = mapR?.getSource('earthquakes');

        const clusterId = features[0].properties?.cluster_id;

        // 获取子元素（递归展开）
        //@ts-ignore
        source?.getClusterLeaves(clusterId, Infinity, 0, (err, children) => {
            console.log('子元素:', children);
        });

        //缩放至聚类范围
        //@ts-ignore
        mapR?.getSource('earthquakes')?.getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
                if (err) return;

                mapR?.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
    });
}


//风场加载和创建
const windFlag = ref(false)
const layerName = 'wind-data';
let interval
const addWindHandle = () => {
    if (windFlag.value) {
        //加载风场
        addWindArea()
    } else {
        //卸载
        clearInterval(interval)
        removeLayerAndSource(mapR!, layerName, 1)
        removeLayerAndSource(mapR!, layerName + "-text", 1)
        removeLayerAndSource(mapR!, layerName, 0)
    }
}

const addWindArea = () => {
    flyTo(mapR!, [119.3231, 25.4828], 12)

    interval = setInterval(() => {
        generalHandle()
    }, 2000)

}

const generalHandle = () => {
    const geojson = createWind()
    //原图层已经存在只需要更新数据
    if (mapR?.getLayer(layerName)) {
        //@ts-ignore
        mapR?.getSource(layerName)?.setData(geojson);
    } else {
        mapR?.addSource(layerName, {
            type: 'geojson',
            data: geojson as any
        })
        mapR?.addLayer({
            id: layerName,
            source: layerName,
            type: 'symbol',
            layout: {
                // 图标id
                "icon-image": ['get', 'img'],
                "icon-size": 0.5,
                "icon-rotate": ["get", "rotate"],
                "icon-rotation-alignment": "map",
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
            },
        })

        // 添加风场文本图层
        mapR?.addLayer({
            id: layerName + "-text",
            source: layerName,
            type: "symbol",
            layout: {
                "text-field": ["get", "name"],
                // "text-font": ["Microsoft YaHei Bold"],
                "text-offset": [0, 1.4],
                "text-anchor": "top",
                "text-size": 15,
            },
            paint: {
                // 文字颜色
                "text-color": "aqua",
            },
        });
    }
}

//创建风场数据
const createWind = () => {
    const geojson = {
        "type": "FeatureCollection",
        "features": [] as any
    }

    for (const item of windList) {
        let size = Math.floor(Math.random() * 10) + 1
        geojson.features.push({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [Number(item.longitude), Number(item.latitude)]
            },
            "properties": {
                name: `${size}区`,
                rotate: Math.floor(Math.random() * 360),
                size: size,
                img: `wind${size}`
            }
        })
    }

    return geojson
}

const stateFlag = ref(false)
const stateHandle = () => {
    if (stateFlag.value) {
        addStates()
    } else {
        removeLayerAndSource(mapR!, 'state-fills', 1)
        removeLayerAndSource(mapR!, 'state-borders', 1)
        removeLayerAndSource(mapR!, 'states', 0)
    }
}

//添加特征值属性，优化用户界面操作
const addStates = () => {
    let hoveredPolygonId;
    mapR?.addSource('states', {
        'type': 'geojson',
        'data': '/geojson/state.geojson',
        generateId: false
    });

    mapR?.addLayer({
        'id': 'state-fills',
        'type': 'fill',
        'source': 'states',
        'layout': {},
        'paint': {
            'fill-color': '#627BC1',
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1,
                0.5
            ]
        }
    });

    mapR?.addLayer({
        'id': 'state-borders',
        'type': 'line',
        'source': 'states',
        'layout': {},
        'paint': {
            'line-color': '#627BC1',
            'line-width': 2
        }
    });

    mapR?.on('mousemove', 'state-fills', (e) => {
        if (e.features!.length > 0) {
            if (hoveredPolygonId !== null) {
                mapR?.setFeatureState(
                    { source: 'states', id: hoveredPolygonId },
                    { hover: false }
                );
            }
            hoveredPolygonId = e.features![0].id;
            mapR?.setFeatureState(
                { source: 'states', id: hoveredPolygonId },
                { hover: true }
            );
        }
    });


    mapR?.on('mouseleave', 'state-fills', () => {
        if (hoveredPolygonId !== null) {
            mapR?.setFeatureState(
                { source: 'states', id: hoveredPolygonId },
                { hover: false }
            );
        }
        hoveredPolygonId = null;
    });

}
</script>

<style scoped>
#map {
    height: 100vh;
}

.container {
    z-index: 9;
    width: 190px;
    height: 40%;
    position: absolute;
    right: 3%;
    top: 3%;
    background-color: rgba(188, 242, 224, 0.7);
    border-radius: 4px;
    padding: 10px 12px;
}

.map-item {
    line-height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #f40f0f;
}
</style>