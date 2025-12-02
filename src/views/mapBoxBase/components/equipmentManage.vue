<!--  -->
<template>
    <WinControl :initCss="{ width: 250, height: 400, x: 900, y: 50 }">
        <div class="my-group">
            <div class="my-flex" v-for="(item) in equipmentList">
                <img width="40" height="40" :src="item.svg" :alt="item.name">
                <el-switch v-model="item.enable" @change="onChange(item)" />
            </div>
        </div>
    </WinControl>
</template>

<script setup lang='ts'>
import mapboxgl from 'mapbox-gl';
import { reactive, toRefs, PropType, onMounted } from 'vue'
import { createImg } from '@/utils/mapTools'
import { equipmentList } from '@/assets/const'
import WinControl from '@/components/winControl/index.vue'

const props = defineProps({
    mapI: {
        type: mapboxgl.Map
    }
})

const onChange = (item) => {

    const mapR = props.mapI
    //获取当前地图的中心点
    const { lng, lat } = mapR!.getCenter();
    if (item.enable) {
        //添加图标
        const dom = createImg(item.svg);
        const result = new mapboxgl.Marker({
            element: dom,
            draggable: true
        }).setLngLat([lng, lat]).setPopup(new mapboxgl.Popup().setHTML(`<h2>${item.name}</h2>`)).addTo(mapR!);
        //把实例添加到对象中
        item.intanst = result
    } else {
        //移除图标
        item.intanst.remove()
        item.intanst = null
    }

}

</script>
<style scoped lang='scss'>
.my-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
}

.my-flex {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100px;
    border: 1px solid rgb(247, 25, 73);
    margin-bottom: 5px;
}
</style>