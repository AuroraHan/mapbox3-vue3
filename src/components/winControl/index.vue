<!--  -->
<template>
    <Vue3DraggableResizable :initW="w" :initH="h" v-model:x="x" v-model:y="y" v-model:w="w" v-model:h="h"
        v-model:active="active" :draggable="true" :resizable="false" class="def-class"
        classNameActive="classNameActive">
        This is a test example
    </Vue3DraggableResizable>
</template>

<script setup lang='ts'>
import { ref } from 'vue'
import Vue3DraggableResizable from 'vue3-draggable-resizable'
import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css'

const x = ref(100)
const y = ref(100)
const h = ref(140)
const w = ref(250)

const active = ref(false)

</script>
<style scoped lang='scss'>
.def-class {
    background-color: aquamarine;
    user-select: none;
}


.classNameActive {
    border-color: #526f82;
    border-radius: 5px;
}
</style>