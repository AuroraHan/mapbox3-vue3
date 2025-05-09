<!--  -->
<template>
    <el-dialog :width="boxSize.width" append-to-body v-model="show" :top="'9vh'" @open="onOpenDialog"
        @close="onCloseDialog" draggable>
        <div id="cesiumDialog" :style="{ height: boxSize.height }"></div>
    </el-dialog>
</template>

<script setup lang='ts'>
import { onActivated, toRefs, ref, PropType } from 'vue'
import * as Cesium from "cesium";

let cesiumV: Cesium.Viewer;
const props = defineProps({
    //控制显示和隐藏
    show: {
        type: Boolean,
        default: false
    },
    //弹出框里面地图的大小
    boxSize: {
        type: Object as PropType<{ width: String, height: String }>,
        default: {
            width: '80%',
            height: '680px'
        }
    }
})

const emits = defineEmits(['exportCesium', 'closeDialog'])

const { show, boxSize } = toRefs(props)

//初始化
const initCesium = () => {
    Cesium.Ion.defaultAccessToken =
        "JhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYTQ2ZjdjNS1jM2E0LTQ1Mc";

    //设置默认观察位置
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
        89.5,
        20.4,
        110.4,
        61.2
    );
    cesiumV = new Cesium.Viewer('cesiumDialog', {
        infoBox: false,
        geocoder: false, //地址查询
        navigationHelpButton: false, //是否现在帮助按钮
        timeline: true,
        animation: true,
        shouldAnimate: true,
        homeButton: false,
        fullscreenButton: false,
        baseLayerPicker: false
    });

    // 使用mapbox的底图 加载xyz
    // var xyz = new Cesium.UrlTemplateImageryProvider({
    //     credit: "mapbox",
    //     url: "/tile/{z}/{x}/{y}.jpg",
    // });
    // cesiumV.imageryLayers.addImageryProvider(xyz);

    //隐藏logo
    //@ts-ignore
    cesiumV.cesiumWidget.creditContainer.style.display = "none";
    //开启帧率
    cesiumV.scene.debugShowFramesPerSecond = true;

    //时间轴日期格式化
    //@ts-ignore
    cesiumV.timeline.makeLabel = function (time) {
        const julianDT = new Cesium.JulianDate();
        Cesium.JulianDate.addHours(time, 0, julianDT); // 调整为北京时间
        const gregorianDT = Cesium.JulianDate.toGregorianDate(julianDT);

        let year = gregorianDT.year + "";
        let month = gregorianDT.month + "";
        let day = gregorianDT.day + "";
        let hour = gregorianDT.hour + "";
        let minute = gregorianDT.minute + "";
        let second = gregorianDT.second + "";

        return ` ${year}年${month.padStart(2, "0")}月${day.padStart(2, "0")}日 ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
    }

    //控制器日期格式化
    cesiumV.animation.viewModel.timeFormatter = function (time) {
        const julianDT = new Cesium.JulianDate();
        Cesium.JulianDate.addHours(time, 0, julianDT); // 调整为北京时间
        const gregorianDT = Cesium.JulianDate.toGregorianDate(julianDT);

        let hour = gregorianDT.hour + "";
        let minute = gregorianDT.minute + "";
        let second = gregorianDT.second + "";

        return ` ${hour.padStart(2, "0")}: ${minute.padStart(2, "0")}: ${second.padStart(2, "0")}`;

    }

    cesiumV.animation.viewModel.dateFormatter = function (time) {
        const julianDT = new Cesium.JulianDate();
        Cesium.JulianDate.addHours(time, 0, julianDT); // 调整为北京时间
        const gregorianDT = Cesium.JulianDate.toGregorianDate(julianDT);

        let month = gregorianDT.month + "";
        let day = gregorianDT.day + "";

        return ` ${gregorianDT.year}年${month.padStart(2, "0")}月${day.padStart(2, "0")}日`;

    }
}

//移除方法
const removeMap = () => {
    cesiumV.destroy()
}

//打开弹出框的回调
const onOpenDialog = async () => {
    await initCesium()

    emits('exportCesium', cesiumV)
}

//关闭弹出框的回调
const onCloseDialog = () => {
    removeMap()
    emits('closeDialog')
}

</script>
<style scoped lang='scss'></style>