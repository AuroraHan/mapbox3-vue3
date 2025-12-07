<template>
    <!-- 工具集 -->
    <div id="cesiumContainer"></div>
    <div class="tools">
        <div class="item">
            <div class="title">标记集</div>
            <el-switch v-model="flagCoordinates" />
        </div>
        <div class="item">
            <div class="title">测绘集</div>
            <el-switch v-model="flagMeasureTool" />
        </div>
        <img @click="boom" src="/images/school.png" alt="" srcset="">
    </div>
    <Coordinates v-if="flagCoordinates"></Coordinates>
    <MeasureTool v-if="flagMeasureTool"></MeasureTool>
</template>

<script setup lang="ts">
import { onMounted, ref, provide } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import Coordinates from './components/coordinates/index.vue'
import MeasureTool from './components/measureTool/index.vue'
import { rotateGlobe } from '../../utils/cesiumTools'
import { functions } from 'lodash';

// import { useCesiumS } from '@/stores/cesiumStore'

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium(
    {
        container: 'cesiumContainer',
        timeline: false,
        animation: false,
        infoBox: false,
        addTerrain: false
    }
)

const flagCoordinates = ref(false)
const flagMeasureTool = ref(false)

onMounted(() => {
    cesiumV = getCesiumViewer()
    provide('myViewer', cesiumV)
    // useCesiumS().setCesiumS(unref(cesiumV))

    //旋转地球效果
    // rotateGlobe(cesiumV)
})

//

const onClickImg = () => {
    document.body.style.cursor = `url(/images/arm/soldier.png) 32 32, help`
}


const boom = () => {
    let billboardCollection = cesiumV.scene.primitives.add(new Cesium.BillboardCollection());
    let particles: any = [];
    // 粒子数量
    const particleCount = 520;
    // 爆炸中心（自己传入）
    const explosionCenter = Cesium.Cartesian3.fromDegrees(120, 31, 1000);

    createExplosion()

    function createExplosion() {
        for (let i = 0; i < particleCount; i++) {

            // 随机方向（单位向量）
            const dir = Cesium.Cartesian3.normalize(
                new Cesium.Cartesian3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.2
                ),
                new Cesium.Cartesian3()
            );

            const billboard = billboardCollection.add({
                image: "/images/fire.png",  // 一张小的亮点/烟雾贴图
                position: explosionCenter,
                width: 20,
                height: 20,
                color: Cesium.Color.WHITE.withAlpha(1.0)
            });

            particles.push({
                billboard,
                dir,                // 扩散方向
                speed: 30 + Math.random() * 30,  // 初速度
                life: 1.0           // 生命周期(透明度)
            });
        }

        // 使用请求动画帧来优化性能
        cesiumV.scene.postRender.addEventListener(updateExplosion);
    }

    function updateExplosion() {

        particles.forEach(p => {
            const b = p.billboard;

            // 计算新位置（沿 dir 扩散）
            const pos = new Cesium.Cartesian3();
            Cesium.Cartesian3.multiplyByScalar(p.dir, p.speed, pos);
            Cesium.Cartesian3.add(b.position, pos, pos);

            b.position = pos;

            // 粒子逐渐消失
            p.life -= 0.015;
            b.color = Cesium.Color.WHITE.withAlpha(p.life);

            // 粒子逐渐变大（烟雾效果）
            b.width += 0.5;
            b.height += 0.5;

            // 生命周期结束移除
            if (p.life <= 0) {
                billboardCollection.remove(b);
            }
        });

        // 清理结束的粒子
        particles = particles.filter(p => p.life > 0);
    }
}

</script>

<style lang="scss" scoped>
#cesiumContainer {
    height: 100vh;
    width: 100%;
}

.tools {
    position: absolute;
    top: 2%;
    left: 3%;
    width: 200px;
    // height: 40px;
    font-size: 18px;
    border-radius: 3px;
    background-color: beige;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .item {
        display: flex;
        align-items: center;
        line-height: 40px;
        font-weight: bold;
        color: rgb(49, 58, 55);

        .title {
            margin-right: 10px;
        }
    }
}
</style>