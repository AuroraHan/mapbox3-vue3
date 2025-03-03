<template>
    <div id="cesiumContainer"></div>
    <div class="pops" id="pops">
        <div class="arrow_box">
            <span id="close" class="pops_close">×</span>
            <div id="con" class="pops_con"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { Popup } from '../../utils/cPopup'

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', infoBox: false })

onMounted(() => {
    cesiumV = getCesiumViewer()
    //弹窗
    var popup = new Popup({
        viewer: cesiumV,
        className: "bx-popup-ctn2"
    });

    // addPopups(popup)

    addTextPopups()
})

//方式一 新增弹出框
const addPopups = (popup) => {
    var hello = cesiumV.entities.add({
        name: '贴地',
        position: Cesium.Cartesian3.fromDegrees(120.166493, 30.9060534),
        point: {
            pixelSize: 10,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,

        }
    });
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

//方式二 新增弹出框
const addTextPopups = () => {
    //添加实体
    cesiumV.entities.add({
        name: '标识',
        position: Cesium.Cartesian3.fromDegrees(120, 30),
        billboard: {
            image: '/images/icon.png',
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            scale: 1,
            show: true,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            width: 32,
            height: 32,
        },
        description: '描述',
        data: {
            name: '公益性公园'
        }
    })

    cesiumV.entities.add({
        name: '标识',
        position: Cesium.Cartesian3.fromDegrees(112, 30),
        billboard: {
            image: '/images/icon.png',
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            scale: 1,
            show: true,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            width: 32,
            height: 32,
        },
        description: '描述',
        data: {
            name: '集团'
        }
    })

    let handle = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas)
    const popup = document.getElementById('pops')!;

    handle.setInputAction((clickEvent) => {
        console.log(clickEvent);
        // 获取被点击的实体
        let pickEd = cesiumV.scene.pick(clickEvent.position);
        console.log(pickEd)
        if (Cesium.defined(pickEd)) {

            let scratch = new Cesium.Cartesian2();

            let data = pickEd.id.data;
            const test = data.name;
            cesiumV.scene.preRender.addEventListener(() => {
                var position = new Cesium.Cartesian3(pickEd.primitive.position.x, pickEd.primitive.position.y, pickEd.primitive.position.z);
                var canvasPosition = cesiumV.scene.cartesianToCanvasCoordinates(position, scratch);
                if (Cesium.defined(canvasPosition)) {
                    const pos = {
                        top: canvasPosition.y + 'px',
                        left: canvasPosition.x + 'px'
                    }
                    popup.style.top = pos.top;
                    popup.style.left = pos.left;
                }
            })
            showCustomPopup(test)
        }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    const close = document.getElementById('close');

    close?.addEventListener('click', () => {
        popup.style.display = 'none'
    })
}

// 示例：简单的自定义弹窗函数
const showCustomPopup = (content) => {
    const con = document.getElementById('con')!;
    const popup = document.getElementById('pops')!;
    popup.style.display = 'block'
    // popup.style.top = position.top;
    // popup.style.left = position.left;
    con.innerHTML = content;
}

</script>

<style>
#cesiumContainer {
    height: 100vh;
}

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

/* --------------------------------- */

.pops {
    position: absolute;
    z-index: 99;
    pointer-events: none;
    width: 300px;
    color: #fff;
    /* height: 180px; */
    /* display: block; */
}

.arrow_box {
    position: relative;
    background: rgba(63, 72, 84, 0.9);
    left: -50%;
    top: -100px;
    padding: 10px;
    border-radius: 3px;
}

.arrow_box:before {
    top: 100%;
    left: 50%;
    border: solid transparent;
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
}


.arrow_box:before {
    border-color: transparent;
    border-top-color: rgba(63, 72, 84, 0.9);
    border-width: 12px;
    margin-left: -12px;
}

.pops_close {
    position: absolute;
    right: 10px;
    top: 5px;
    cursor: pointer;
    font-size: 16px;
    z-index: 100;
    pointer-events: auto;
}

.pops_con {
    margin-top: 10px;
}
</style>