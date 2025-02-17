<!-- 设备管理器 -->
<template>
    <div>
        <div class="my-group">
            <div class="my-flex" v-for="(item) in equipmentList">
                <img width="70" height="70" :src="item.svg" :alt="item.name">
                <el-switch v-model="item.enable" @change="onChange(item)" />
            </div>
        </div>
    </div>
</template>

<script setup lang='ts'>
import { ref, defineEmits } from 'vue'
import { equipmentList } from '../../assets/const'

const emits = defineEmits(['selectBox'])

const onChange = (item) => {
    emits('selectBox', item)
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