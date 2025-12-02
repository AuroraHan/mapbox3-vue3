<template>
    <div id="m-popup1">
        <div class="site">
            {{ objInfo.imageId }}
        </div>
    </div>
</template>

<script lang='ts' setup>
import { PropType } from 'vue';
const props = defineProps({
    objInfo: {
        type: Object as PropType<any>
    }
})


</script>
<style lang='scss' scoped>
#m-popup1 {
    width: 330px;
    height: 230px;
    font-size: 18px;
    line-height: 24px;
    background-color: aqua;

}
</style>