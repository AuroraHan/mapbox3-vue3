<template>
    <div class="map" id="map" ref="map">
        <pre
            class="lonlat">经度:{{ Number(jw?.lng).toFixed(5) }} 纬度:{{ Number(jw?.lat).toFixed(5) }} 层级:{{ zoom.toFixed(1) }}</pre>
        <div class="select-map" @click="addDemData">视</div>
        <div class="look-map" @click="changeMap">切</div>
    </div>
    <Transition enter-active-class="animate__animated animate__bounceIn"
        leave-active-class="animate__animated animate__fadeOutUp">
        <div class="my-dialog" v-show="visible">
            <div class="title">
                地图切换
                <span @click="onClose">X</span>
            </div>
            <div class="containerbox">
                <el-table :data="mapStyleR" height="95%" :header-cell-style="headerCellStyle">
                    <el-table-column label="序号" type="index" width="70" align="center" />
                    <el-table-column label="名称" prop="name" align="center" />
                    <el-table-column label="类别" prop="typeName" align="center"></el-table-column>
                    <el-table-column label="操作" align="center">
                        <template #default="scope">
                            <el-switch v-model="scope.row.enabled"
                                style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                                @change="onChangeMap(scope.row)" />
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
    </Transition>
</template>

<script lang='ts' setup>
import mapboxgl from 'mapbox-gl';
import { ref, onMounted, onUnmounted } from 'vue';
import { PointLike, LayerSpecification, RasterSourceSpecification, SourceSpecification } from 'mapbox-gl';
import { mapStyle } from './config';

const headerCellStyle = {
    textAlign: 'center',
    background: '#3e5a68',
    color: '#000000',
}

//map
let mapR: mapboxgl.Map | null = null;

const mapStyleR = ref(mapStyle)

//当前经纬度
const jw = ref<{ lat: number, lng: number }>({ lat: 0, lng: 0 });

//当前缩放层级
const zoom = ref<Number>(0)

//当前选择的地图
const currentMain = ref()

onMounted(() => {
    initMap();
})

onUnmounted(() => {
    mapR?.remove()
    console.log(mapR, 'qian');
    mapR = null
    console.log(mapR, 'hou');
})



//初始化地图 version: "3.6.0"
const initMap = () => {

    const currentObj = mapStyleR.value.find((item) => {
        return item.enabled
    })

    currentMain.value = currentObj

    let key = currentObj?.id
    let sources = {
        //@ts-ignore
        [key]: {
            type: currentObj?.type,
            tiles: currentObj?.tiles,
            tileSize: 256,
        }
    }

    let layers = [
        {
            id: key,
            type: currentObj?.type,
            source: key,
            minzoom: currentObj?.minzoom,
            maxzoom: currentObj?.maxzoom,
        }
    ] as LayerSpecification[]

    mapboxgl.accessToken =
        "pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA";
    const map = new mapboxgl.Map({
        container: "map",
        projection: 'globe',
        style: {
            version: 8,
            sources: sources,
            // sprite: "http://localhost:5173/static/admin/mapboxoffline/images/sprite", //图标
            // 字体文件
            // glyphs: "http://192.168.138.172:8086/static/admin/mapboxoffline/font/{fontstack}/{range}.pbf",
            glyphs: "../../static/glyphs/{fontstack}/{range}.pbf",
            layers: layers,
        },
        center: [120.2191, 30.2202],
        zoom: 2,
        minZoom: 1,
        maxZoom: 18,
        antialias: true,
    });

    map.addControl(new mapboxgl.ScaleControl()); //比例尺
    map.addControl(new mapboxgl.NavigationControl()); //缩放
    map.addControl(new mapboxgl.FullscreenControl()); //全屏

    map.on('style.load', () => {
        // 设置地球背景
        map.setFog({
            color: "rgb(186, 210, 235)",
            "high-color": "rgb(36, 92, 223)",
            "horizon-blend": 0.02,
            "space-color": "rgb(11, 11 ,25)",
            "star-intensity": 0.6,
        });

    })

    map.on('mousemove', (e: { lngLat: { lat: number, lng: number } }) => {
        jw.value = e.lngLat;
    })

    map.on('zoom', () => {
        zoom.value = map.getZoom() as Number;
    })

    mapR = map;
    mapR.removeControl(map._logoControl);

    map.on('load', () => {
    })

    map.on('click', (e) => {
        const bbox = [
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5]
        ] as [PointLike, PointLike];

        const hdFeatures = mapR!.queryRenderedFeatures(bbox)
        console.log(hdFeatures, 'kkkkkk');

    })

    map.on('moveend', () => {
        //只有geojson才重新获取边缘
        if (currentMain.value.type == 'geojson') {
            const layer = map.getSource(currentMain.value.id)
            if (layer) {
                //@ts-ignore
                layer.setData(setBboxBounds(currentMain.value.url))
            }
        }

        // if (currentMain.value.type == 'raster-dem') {
        //     const layer = map.getSource(currentMain.value.id)
        //     if (layer) {
        //         //@ts-ignore
        //         layer.setData([setBboxBounds(currentMain.value.tiles[0])])
        //     }
        // }

    })
}

//切换投影视角
let isLook = false;
const lookMap = () => {
    if (isLook) {
        mapR?.setProjection('globe')
    } else {
        mapR?.setProjection('mercator')
    }
    isLook = !isLook
}

const addWmsSever = () => {
    mapR?.addSource('wms-world', {
        type: 'raster',
        tiles: [
            "geoserverApi/geoserver/ne/wms?service=WMS&version=1.1.0&request=GetMap&layers=ne%3Acountries&bbox={bbox-epsg-3857}&width=768&height=370&srs=EPSG%3A3857&styles=&format=image%2Fjpeg"
        ],
        tileSize: 256
    })
    mapR?.addLayer({
        id: 'wms-world',
        type: 'raster',
        source: 'wms-world'
    })
}

const addPbfServer = () => {
    mapR?.addLayer({
        id: 'pbf-world',
        type: 'fill',
        source: {
            type: 'vector',
            tiles: [
                'http://127.0.0.1:10001/geoserver/ne/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=ne:countries&STYLE=ne:countries_mapcolor9&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}'
            ]
        },
        "source-layer": 'countries',
        paint: {
            "fill-color": "#ff0000",
            "fill-outline-color": "#ffff00",
        }
    })
}

//添加高程数据
const addDemData = () => {
    mapR?.addSource('dem', {
        type: 'raster-dem',
        tiles: ['/dem/global/{z}/{x}/{y}.png'],
        tileSize: 256
    })
    mapR?.setTerrain({ source: 'dem', exaggeration: 1.5 })
    mapR?.addLayer({
        id: 'dem',
        type: 'hillshade',
        source: 'dem',
        paint: {
            // "hillshade-shadow-color": "#ffffff",
            // "hillshade-accent-color": "#ffffff"
        }
    })
}

//控制弹出框
const visible = ref<boolean>(false)
const changeMap = () => {
    visible.value = true;
}

const onClose = () => {
    visible.value = false;
}

//切换地图服务
const onChangeMap = (item) => {
    currentMain.value = item;
    switchMapServer(item)
}


//切换不同地图数据
const switchMapServer = (item) => {
    //打开按钮
    if (item.enabled) {
        if (mapR?.getLayer(item.id)) {
            mapR?.setLayoutProperty(currentMain.value.id, "visibility", 'visible');
            return;
        }
        //栅格
        if (item.type == 'raster') {
            let source = {
                type: 'raster',
                tiles: item.tiles,
                tileSize: item.tileSize,
                minzoom: item.minzoom,
                maxzoom: item.maxzoom
            } as RasterSourceSpecification
            //是否需要进行切片
            if (item.scheme) {
                source = Object.assign(source, { scheme: "tms", })
            }
            mapR?.addSource(item.id, source)
            mapR?.addLayer({
                id: item.id,
                type: 'raster',
                source: item.id
            })

            return
        }
        //矢量
        if (item.type == 'vector') {
            let source = {
                type: 'vector',
                tiles: item.tiles,
                minzoom: item.minzoom,
                maxzoom: item.maxzoom
            } as SourceSpecification
            mapR?.addSource(item.id, source)

            mapR?.addLayer({
                id: item.id,
                type: item.layerType,
                source: item.id,
                "source-layer": item.sourceLayer,
                layout: item.layout,
                paint: item.paint
            })

            return
        }
        //geojson
        if (item.type == 'geojson') {
            const url = setBboxBounds(item.url)
            mapR?.addSource(item.id, {
                type: 'geojson',
                data: url,
            })

            mapR?.addLayer({
                id: item.id,
                type: item.layerType,
                source: item.id,
                paint: item.paint,
                layout: item.layout
            })

            //是否加载文本标识
            if (item.enableText) {
                mapR?.addLayer({
                    id: item.id + 'text',
                    type: 'symbol',
                    source: item.id,
                    paint: item.textPaint,
                    layout: item.textLayout
                })
            }

            return
        }
        //地形 
        if (item.type == 'raster-dem') {
            // const url = setBboxBounds(item.url)
            // mapR?.addSource(item.id, {
            //     type: 'raster-dem',
            //     url: url,
            //     tileSize: item.tileSize,
            //     // "scheme": "tms",
            // })

            // mapR?.setTerrain({ source: item.id, exaggeration: 1.5 })

            // mapR?.addLayer({
            //     id: item.id,
            //     type: 'hillshade',
            //     source: item.id,
            //     paint: {
            //         // "hillshade-shadow-color": "#ffffff",
            //         // "hillshade-accent-color": "#ffffff"
            //     }
            // })
        }
        //建筑物
        if (item.type == 'fill-extrusion') {
            mapR?.addSource(item.id, {
                type: 'vector',
                tiles: item.tiles,
            })

            mapR?.addLayer({
                id: item.id,
                type: 'fill-extrusion',
                source: item.id,
                "source-layer": item.sourceLayer,
                paint: item.paint,
                minzoom: 9
            })
        }
        //地形
        if (item.type == 'raster-dem') { }
    } else {
        mapR?.setLayoutProperty(currentMain.value.id, "visibility", 'none')
    }

}

//获取边界边框经纬度
const setBboxBounds = (url: string) => {
    let newUrl;

    let bounds = mapR?.getBounds();

    let sw_lng = bounds?.getSouthWest().lng;
    let sw_lat = bounds?.getSouthWest().lat;
    let ne_lng = bounds?.getNorthEast().lng;
    let ne_lat = bounds?.getNorthEast().lat;

    newUrl = url.replace('$sw_lng$', String(sw_lng))
        .replace('$sw_lat$', String(sw_lat))
        .replace('$ne_lng$', String(ne_lng))
        .replace('$ne_lat$', String(ne_lat))

    return newUrl
}
</script>
<style scoped>
.map {
    width: 100%;
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


.select-map {
    width: 30px;
    height: 30px;
    font-size: 18px;
    position: absolute;
    right: 10px;
    top: 16%;
    font-weight: bold;
    border: 1px solid #000;
    line-height: 30px;
    text-align: center;
    z-index: 8;
    background-color: #ffee88;
    color: #000;
    cursor: pointer;
}

.look-map {
    width: 30px;
    height: 30px;
    font-size: 18px;
    position: absolute;
    right: 10px;
    top: 21%;
    font-weight: bold;
    border: 1px solid #000;
    line-height: 30px;
    text-align: center;
    z-index: 8;
    background-color: #ffee88;
    color: #000;
    cursor: pointer;
}

.my-dialog {
    padding: 8px;
    z-index: 3;
    width: 40%;
    height: 400px;
    position: absolute;
    left: 30%;
    top: 25%;
    color: #fff;
    background-color: rgba(25, 55, 67, 0.9);
}

.title {
    font-size: 22px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
}

.title span {
    cursor: pointer;
}

.containerbox {
    height: 94%;
    overflow: auto;
}
</style>