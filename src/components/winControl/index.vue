<!--  -->
<template>
    <Vue3DraggableResizable :initW="w" :initH="h" v-model:x="x" v-model:y="y" v-model:w="w" v-model:h="h"
        v-model:active="active" :draggable="true" :resizable="false" :parent="true" class="def-class"
        classNameActive="classNameActive">
        <div class="close" @click="onClose">X</div>
        <slot></slot>
    </Vue3DraggableResizable>
</template>

<script setup lang='ts'>
import { ref, defineProps, PropType, onMounted, toRefs } from 'vue'
import Vue3DraggableResizable from 'vue3-draggable-resizable'
import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css'

const x = ref(100)
const y = ref(100)
const h = ref(340)
const w = ref(280)

const props = defineProps({
    initCss: Object as PropType<{
        width: number,
        height: number
    }>
})

const active = ref(false)

onMounted(() => {
    const { initCss } = toRefs(props)
    if (initCss && initCss.value?.width) {
        w.value = initCss.value.width
    }

    if (initCss && initCss.value?.height) {
        h.value = initCss.value.height
    }
})

//点击关闭弹出框
const onClose = () => {

}

</script>
<style scoped lang='scss'>
.def-class {
    background-color: rgba(55, 59, 58, 0.7);
    user-select: none;
    padding: 4px;
    color: #fff;
}


.classNameActive {
    border-color: #9aa9b4;
    border-radius: 5px;
}

.close {
    display: flex;
    justify-content: end;
    cursor: pointer;
    border-bottom: 1px solid;
    margin-bottom: 4px;
}
</style>