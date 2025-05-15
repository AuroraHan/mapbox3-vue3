<template>
    <div class="m-pop">
        {{ title }}

        <button @click="onpop">按钮</button>
    </div>
</template>

<script setup>
import { onMounted } from 'vue'
import emitter from '/@/mitt/index'

const props = defineProps({
    title: {
        type: String
    }
})

const onpop = () => {
    emitter.emit('test', 121)
}

</script>

<style scoped>
.m-pop {
    width: 200px;
    height: 200px;
}
</style>