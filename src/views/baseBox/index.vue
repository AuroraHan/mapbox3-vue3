<template>
    <div class="menu">
        <div class="title">基础页面</div>
        <div class="container">
            <div class="box" v-for="(item, index) in baseFilter" @click="onClick(item)">
                {{ item.name }}
            </div>
        </div>
    </div>
    <div class="menu">
        <div class="title">Mapbox</div>
        <div class="container">
            <div class="box" v-for="(item, index) in mapboxFilter" @click="onClick(item)">
                {{ item.name }}
            </div>
        </div>
    </div>
    <div class="menu">
        <div class="title">Cesium</div>
        <div class="container">
            <div class="box" v-for="(item, index) in cesiumFilter" @click="onClick(item)">
                {{ item.name }}
            </div>
        </div>
    </div>
    <div class="menu">
        <div class="title">第三方</div>
        <div class="container">
            <div class="box" v-for="(item, index) in otherFilter" @click="onClick(item)">
                {{ item.name }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const one = ref('mapbox')

const routsList = ref([
    {
        name: '基础空白页面',
        path: 'basePage',
        type: 'custom'
    },
    {
        name: '基础Mapbox',
        path: 'mapBoxBase',
        type: 'mapbox'
    },
    {
        name: 'Mapbox各种效果',
        path: 'mapboxLayer',
        type: 'mapbox'
    },
    {
        name: 'Mapbox-历史回放',
        path: 'mapboxPopup',
        type: 'mapbox'
    },
    {
        name: 'Mapbox弹出框',
        path: 'popup',
        type: 'mapbox'
    },
    {
        name: 'Mapbox+Shader',
        path: 'mapboxShader',
        type: 'mapbox'
    },
    {
        name: 'Mapbox+Three',
        path: 'mapboxThree',
        type: 'mapbox'
    },
    {
        name: 'Mapbox图层切换',
        path: 'mapboxVector',
        type: 'mapbox'
    },
    {
        name: 'Mapbox高德路径规划',
        path: 'mapBoxGaoDe',
        type: 'mapbox'
    },
    {
        name: '基础Cesium',
        path: 'baseCesium',
        type: 'cesium'
    },
    {
        name: 'Cesium弹出框',
        path: 'cesiumPopup',
        type: 'cesium'
    },
    {
        name: 'Cesium标绘',
        path: 'cesiumMeasure',
        type: 'cesium'
    },
    {
        name: 'Cesium飞行',
        path: 'cesiumFlyModel',
        type: 'cesium'
    },
    {
        name: 'Cesium体渲染',
        path: 'cesiumVoxel',
        type: 'cesium'
    },
    {
        name: 'Cesium网格体渲染',
        path: 'cesiumVoxelBox',
        type: 'cesium'
    },
    {
        name: 'Cesium聚合',
        path: 'cesiumCluster',
        type: 'cesium'
    },
    {
        name: 'Cesium+shader',
        path: 'cesiumShader',
        type: 'cesium'
    },
    {
        name: 'Cesium时间飞行',
        path: 'cesiumFlyTime',
        type: 'cesium'
    },
    {
        name: 'ThreeBox',
        path: 'baseThreeBox',
        type: 'other'
    },
    {
        name: 'Mapbox飞机飞行',
        path: 'mapBoxAircraft',
        type: 'other'
    },
    {
        name: 'L7',
        path: 'mapboxL7',
        type: 'other'
    },
    {
        name: 'Mapbox风场加载',
        path: 'mapboxWind',
        type: 'mapbox'
    },
    {
        name: 'three火焰',
        path: 'baseThree',
        type: 'other'
    },

])

const mapboxFilter = computed(() => {
    const temp = routsList.value
    return temp.filter(e => e.type == 'mapbox')
})

const cesiumFilter = computed(() => {
    const temp = routsList.value
    return temp.filter(e => e.type == 'cesium')
})

const baseFilter = computed(() => {
    const temp = routsList.value
    return temp.filter(e => e.type == 'custom')
})

const otherFilter = computed(() => {
    const temp = routsList.value
    return temp.filter(e => e.type == 'other')
})


const onClick = (item: any) => {
    router.push({ name: item.path })
}

</script>

<style scoped lang="scss">
.menu {
    width: 100%;

    .title {
        height: 50px;
        border-bottom: 1px solid sandybrown;
        line-height: 50px;
        font-weight: bold;
        padding-left: 20px;
        font-size: 22px;
        margin-bottom: 8px;
    }
}

.container {
    padding: 5px;
    display: flex;
    // display: grid;
    // grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    // grid-template-rows: 230px 230px 230px 230px;
    // grid-gap: 8px;
    // height: 100%;

    .box {
        padding: 5px 12px;
        width: 180px;
        height: 90px;
        background-color: #64ac29;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        margin-left: 12px;
        transition: all 0.3s ease;
        border-radius: 5px;
        /* 添加过渡效果 */

        &:hover {
            background-color: #5ee69b;
            color: #2b3135;
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
    }
}
</style>