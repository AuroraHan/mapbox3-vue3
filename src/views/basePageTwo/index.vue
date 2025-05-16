<template>
    <h1>测试页面2</h1>
    <hr>
    <h3 @click="open">测试弹出框</h3>
    <MapTimePopup mapId='map-popup' :show="resultDialog"></MapTimePopup>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MapTimePopup from '/@/components/mapTimePopup/index.vue'


onMounted(() => {

})

//--------------------------
const resultDialog = ref(false)
const open = () => {
    resultDialog.value = !resultDialog.value
}
</script>

<style scoped>
.my-con {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 50px;
}

.left {
    width: 8%;
    display: flex;
}

.oper {
    margin-right: 5px;
    font-size: 17px;
    font-weight: bold;
    cursor: pointer;
}

.right {
    width: 90%;
}

h1 {
    text-align: center;
}
</style>