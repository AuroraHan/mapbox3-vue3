<template>
    <div id="cesiumContainer"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { Popup } from '../../utils/cPopup'

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer' })

onMounted(() => {
    cesiumV = getCesiumViewer()
    //弹窗
    var popup = new Popup({
        viewer: cesiumV,
        className: "bx-popup-ctn2"
    });

    addPopups(popup)
})

const addPopups = (popup) => {
    popup.add({
        geometry: Cesium.Cartesian3.fromDegrees(120.166493, 30.9060534),
        content: {
            header: "数据点",
            content: `
              <div><span>监控名称：</span><span>中国银行(银河三路店)</span></div>
              <div><span>监控编号：</span><span>${Math.random() * 100}</span></div>
              <div><span>监控类型：</span><span>固定枪机</span></div>
              <div><span>监控状态：</span><span>在线</span></div>
                  `
        },
        isclose: true
    });
}

</script>

<style scoped>
.bx-popup-ctn2 {
    position: absolute;
    z-index: 999;
    color: #fff;
    /* margin: -80px 0 0; */
    margin: 0 0 0 0;
    transform: translate(-50%, -100%)
}

.bx-popup-ctn2 .divpoint-wrap {
    padding: 0;
    width: max-content
}

.bx-popup-ctn2 .divpoint-center {
    background: linear-gradient(45deg, #4f869d, rgba(18, 93, 120, .65), 40%, rgba(30, 127, 162, .65));
    border: 1px solid #40aee2;
    border-radius: 5px;
    box-shadow: 0 0 10px 2px #29baf1
}

.bx-popup-ctn2 .bx-popup-tip {
    width: 17px;
    background: #fff;
    height: 17px;
    padding: 1px;
    margin: -10px auto 0;
    -webkit-transform: rotate(45deg);
    -moz-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    transform: rotate(45deg)
}

.bx-popup-ctn2 .bx-popup-header-ctn {
    background: rgba(0, 173, 255, .49);
    color: #fff;
    font-size: 15px;
    padding: 4px
}

.bx-popup-ctn2 .bx-popup-close {
    position: absolute;
    top: 4px;
    right: 2px;
    width: 26px;
    height: 26px;
    cursor: pointer
}

.bx-popup-ctn2 .bx-popup-content-ctn {
    padding: 10px
}

.bx-popup-ctn2 .directional {
    bottom: 0;
    left: 0;
    width: 2px;
    height: 40px;
    background-color: #28bbf0;
    transform: none;
    margin: 0 0 0px 50%
}

.bx-popup-ctn2 .divpoint-border {
    transition: .3s ease-in;
    background: linear-gradient(0, #8cdee5 2px, #8cdee5 0) no-repeat, linear-gradient(-90deg, #8cdee5 2px, #8cdee5 0) no-repeat, linear-gradient(-180deg, #8cdee5 2px, #8cdee5 0) no-repeat, linear-gradient(-270deg, #8cdee5 2px, #8cdee5 0) no-repeat;
    background-size: 0 2px, 2px 0, 0 2px, 2px 0;
    background-position: 0 0, 100% 0, 100% 100%, 0 100%
}

.bx-popup-ctn2 .divpoint-border:hover {
    background-size: 100% 2px, 2px 100%, 100% 2px, 2px 100%
}
</style>