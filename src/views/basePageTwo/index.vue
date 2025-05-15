<template>
    <h1>测试页面2</h1>
    <hr>
    <!-- <div class="my-con">
        <div class="left">
            <div class="oper" @click="onStart">开始</div>
            <div class="oper" @click="onStop">暂停</div>
            <div class="oper">倍速</div>
        </div>
        <div class="right">
            <div id="my-time"></div>
        </div>
    </div>
    <hr>
    {{ clock.currentTime }} -->

    <hr>
    <h1 @click="open">测试弹出框</h1>
    <MapTimePopup mapId='map-popup' :show="resultDialog"></MapTimePopup>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
// import Timeline from './Timeline'
import * as Cesium from "cesium";
import MapTimePopup from '/@/components/mapTimePopup/index.vue'


onMounted(() => {
    // getDom()
})

// const handleSetTime = (e: any) => {
//     console.log(e, 'kkkk');
//     const scrubJulian = e.timeJulian;
//     clock.currentTime = scrubJulian;

//     // if (defined(timeline)) {
//     //     const scrubJulian = e.timeJulian;
//     //     clock.shouldAnimate = false;
//     //     clock.currentTime = scrubJulian;
//     //     updateScrubTime(scrubJulian);
//     // }
// }


// let clockRef = reactive({
//     startTime: Cesium.JulianDate.fromIso8601("2024-11-25T13:12:30Z"),
//     currentTime: Cesium.JulianDate.fromIso8601("2024-12-25T12:12:30Z"),
//     stopTime: Cesium.JulianDate.fromIso8601("2024-12-30T13:12:30Z"),
//     clockRange: Cesium.ClockRange.LOOP_STOP,
//     // clockStep: Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER,
//     clockStep: Cesium.ClockStep.TICK_DEPENDENT,
//     multiplier: 1,//倍速
//     shouldAnimate: true
// })


let timeObj = reactive({
    currentTime: Cesium.JulianDate.fromIso8601("2024-12-25T12:12:30Z")
})

// 定义时间
// let clock = reactive(new Cesium.Clock({
//     startTime: Cesium.JulianDate.fromIso8601("2024-11-25T13:12:30Z"),// 加Z处理时区问题
//     currentTime: Cesium.JulianDate.fromIso8601("2024-12-25T12:12:30Z"),
//     stopTime: Cesium.JulianDate.fromIso8601("2024-12-30T13:12:30Z"),
//     clockRange: Cesium.ClockRange.LOOP_STOP,
//     // clockStep: Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER,
//     clockStep: Cesium.ClockStep.TICK_DEPENDENT,
//     multiplier: 60,//倍速
//     shouldAnimate: true
// }));

// const getDom = () => {
//     const timeline = new Timeline("my-time", clock);

//     //设置标记线
//     timeline.addTrack(
//         new Cesium.TimeInterval({
//             start: Cesium.JulianDate.fromIso8601("2024-11-25T13:12:30Z"),
//             stop: Cesium.JulianDate.addSeconds(clock.startTime, 3 * 24 * 60 * 60, new Cesium.JulianDate()),
//         }),
//         8,
//         Cesium.Color.RED,
//         new Cesium.Color(0.55, 0.55, 0.55, 0.25),
//     );

//     timeline.addEventListener("settime", handleSetTime, false);

// }

//点击开始
// const onStart = () => {
//     clock.shouldAnimate = true
//     function tick() {
//         clock.tick();
//         requestAnimationFrame(tick);
//         // clock.currentTime = Cesium.JulianDate.toIso8601(clock.currentTime);
//         // console.log(Cesium.JulianDate.toIso8601(clock.currentTime));

//     }
//     requestAnimationFrame(tick);
// }

// const onStop = () => {
//     clock.shouldAnimate = false
// }

//--------------------------
const resultDialog = ref(false)
const open = () => {
    resultDialog.value = !resultDialog.value
}
</script>

<style scoped>
.my-con {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 50px;
}

.left {
    width: 8%;
    display: flex;
}

.oper {
    margin-right: 5px;
    font-size: 17px;
    font-weight: bold;
    cursor: pointer;
}

.right {
    width: 90%;
}

h1 {
    text-align: center;
}

.cesium-timeline-main {
    position: relative;
    left: 0;
    bottom: 0;
    overflow: hidden;
    border: solid 1px #888;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.cesium-timeline-trackContainer {
    width: 100%;
    overflow: auto;
    border-top: solid 1px #888;
    position: relative;
    top: 0;
    left: 0;
}

.cesium-timeline-tracks {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
}

.cesium-timeline-needle {
    position: absolute;
    left: 0;
    top: 1.7em;
    bottom: 0;
    width: 1px;
    background: #f00;
}

.cesium-timeline-bar {
    position: relative;
    left: 0;
    top: 0;
    overflow: hidden;
    cursor: pointer;
    width: 100%;
    height: 1.7em;
    background: linear-gradient(to bottom,
            rgba(116, 117, 119, 0.8) 0%,
            rgba(58, 68, 82, 0.8) 11%,
            rgba(46, 50, 56, 0.8) 46%,
            rgba(53, 53, 53, 0.8) 81%,
            rgba(53, 53, 53, 0.8) 100%);
}

.cesium-timeline-ruler {
    /* NOTE: The label and the ruler must use the same font/size */
    visibility: hidden;
    white-space: nowrap;
    font-size: 80%;
    z-index: -200;
}

.cesium-timeline-highlight {
    position: absolute;
    bottom: 0;
    left: 0;
    background: #08f;
}

.cesium-timeline-ticLabel {
    position: absolute;
    top: 0;
    left: 0;
    white-space: nowrap;
    font-size: 80%;
    color: #eee;
}

.cesium-timeline-ticMain {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 1px;
    height: 50%;
    background: #eee;
}

.cesium-timeline-ticSub {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 1px;
    height: 33%;
    background: #aaa;
}

.cesium-timeline-ticTiny {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 1px;
    height: 25%;
    background: #888;
}

.cesium-timeline-icon16 {
    display: block;
    position: absolute;
    width: 16px;
    height: 16px;
    background-image: url("../../assets/nav2.png");
    background-repeat: no-repeat;
}
</style>