<template>
    <WinControl v-if="modelValue" :initCss="{ width: 350, height: 300, x: 500, y: 300 }" :title="'综合分析'">
        <template #close><el-button @click="hide" type="danger">关闭</el-button></template>
        <div>
            <el-table :data="tableList" border :header-cell-style="headerCellStyle">
                <el-table-column label="类别" prop="name" align="center"></el-table-column>
                <el-table-column label="操作" align="center">
                    <template #default="scope">
                        <el-switch v-model="scope.row.enable" @change="onCluster" />
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </WinControl>
</template>

<script lang='ts' setup>
import { ref, onMounted } from 'vue';
import WinControl from '/@/components/winControl/index.vue'
import * as Cesium from 'cesium';
import { Cluster } from './analysisTools'

const headerCellStyle = {
    textAlign: 'center',
    background: '#67c23a',
    color: '#fff',
}

const props = defineProps({
    modelValue: {
        type: Boolean
    },
    viewerI: {
        type: Cesium.Viewer
    },

})
const emits = defineEmits(['update:modelValue'])

const hide = () => {
    emits('update:modelValue', false)
}

const tableList = ref([
    {
        name: '聚类分析',
        enable: false
    }
])

//聚类分析
const onCluster = () => {
    //打开
    const cesiumV = props.viewerI!
    if (tableList.value[0].enable) {
        const cluster = new Cluster({ viewer: cesiumV })
        cluster.clickMouseLeft()
    } else {
        //清除
        const dataSource = cesiumV.dataSources.getByName('point-cluster');
        cesiumV.dataSources.remove(dataSource[0])
    }

}
</script>
<style lang='scss' scoped>
:deep(.el-table tr) {
    font-size: 16px;
    font-weight: inherit;
}
</style>