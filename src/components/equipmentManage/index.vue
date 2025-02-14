<!-- 设备管理器 -->
<template>
    <div>
        <el-checkbox-group class="group-checkbox" v-model="iconLists" @change="onChange">
            <el-checkbox class="item-checkbox" :value="item.id" v-for="(item) in equipmentList">
                <img width="70" height="70" :src="item.svg" :alt="item.name">
            </el-checkbox>
        </el-checkbox-group>
        {{ iconLists }}


    </div>
</template>

<script setup lang='ts'>
import { ref, defineEmits } from 'vue'
import { equipmentList } from '../../assets/const'

const iconLists = ref([])

const emits = defineEmits(['selectBox'])

const onChange = () => {
    const list: Array<any> = []
    iconLists.value.forEach((item) => {
        const result = equipmentList.filter((ele) => {
            return ele.id == item
        })

        list.push(...result)
    })
    emits('selectBox', list)
}

</script>
<style scoped lang='scss'>
.my-flex {
    display: flex;
    justify-content: center;
}

.group-checkbox {
    display: flex;
    flex-wrap: wrap;
    // justify-content: space-between;
    align-items: center;

    .item-checkbox {
        width: 120px;
        height: 120px;
    }
}
</style>