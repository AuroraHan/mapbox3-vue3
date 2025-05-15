<template>
    <div v-show="infoShow" :style="{ left: positionXY.xAxis + 'px', top: positionXY.yAxis + 'px' }"
        class="dialog-content">
        <div class="center">
            <div class="custom">
                <div @click="closeDialog">X</div>
                <div>这是一个弹出框</div>
            </div>
            <div class="arrow"></div>
        </div>
    </div>
</template>

<script lang='ts' setup>
import { ref, onMounted } from 'vue';


const infoShow = ref(false)

const props = defineProps({
    positionXY: {
        type: Object,
        default: {
            xAxis: 0,
            yAxis: 0
        }
    }
})


//打开弹出框
const openDialog = () => {
    infoShow.value = true
}

//关闭弹出框
const closeDialog = () => {
    infoShow.value = false
}

defineExpose({
    openDialog, closeDialog
})

</script>
<style lang='scss' scoped>
.dialog-content {
    background-color: antiquewhite;
    width: 200px;
    font-size: 18px;
    position: absolute;

    .center {

        .custom {}

        .arrow {
            position: relative;
        }

        .arrow:before {
            top: 100%;
            left: 50%;
            border: solid transparent;
            content: " ";
            height: 0;
            width: 0;
            position: absolute;
            pointer-events: none;
        }


        .arrow:before {
            border-color: transparent;
            border-top-color: rgba(170, 226, 17, 0.9);
            border-width: 12px;
            margin-left: -12px;
        }
    }
}
</style>