<template>
    <div id="cesiumContainer"></div>
    <div class="lnglat" @click="addFleet">
        经度:{{ lnglat.longitude }} &nbsp;纬度:{{ lnglat.latitude }}
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '@/hooks/useCesium'
import { getCurrentPositionByMouse } from '@/utils/cesiumTools'
import { FleetManager } from './utils';

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({
    container: 'cesiumContainer',
    infoBox: true,
    animation: false,
    timeline: false,
})


onMounted(() => {
    cesiumV = getCesiumViewer()
    getLngLat()
})

//根据鼠标获取经纬度
const lnglat = reactive({
    longitude: 0,
    latitude: 0,
    height: 0
})
const getLngLat = () => {
    Cesium.BillboardCollection
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas)

    handler.setInputAction((movement: any) => {
        const lnglathig = getCurrentPositionByMouse(cesiumV.scene, movement.endPosition, null)
        if (Cesium.defined(lnglathig)) {
            let carto = Cesium.Cartographic.fromCartesian(lnglathig);
            lnglat.latitude = Number(Cesium.Math.toDegrees(carto.latitude).toFixed(3));
            lnglat.longitude = Number(Cesium.Math.toDegrees(carto.longitude).toFixed(3));
            lnglat.height = Number(carto.height.toFixed(1));
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

//======================
const addFleet = () => {
    const fleet = new FleetManager(cesiumV);
    // 航母
    fleet.createCarrier(
        Cesium.Cartesian3.fromDegrees(120.0, 30.0, 10)
    );

    // 两艘护卫舰
    fleet.createShip(
        'ship-1',
        Cesium.Cartesian3.fromDegrees(120.02, 30.01, 10)
    );

    fleet.createShip(
        'ship-2',
        Cesium.Cartesian3.fromDegrees(119.98, 30.01, 10)
    );

    // 一架飞机
    fleet.createPlane(
        'plane-1',
        Cesium.Cartesian3.fromDegrees(120.0, 30.05, 7000)
    );

    let angle = 0;

    fleet.units.forEach(unit => {
        if (unit.id === 'plane-1') {
            unit.position = new Cesium.CallbackProperty(() => {
                angle += 0.005;
                return Cesium.Cartesian3.fromDegrees(
                    120.0 + Math.cos(angle) * 0.005,
                    30.0 + Math.sin(angle) * 0.005,
                    3000
                );
            }, false);
        }
    });
}

</script>

<style scoped>
#cesiumContainer {
    height: 100vh;
}

.lnglat {
    position: absolute;
    top: 2%;
    left: 3%;
    width: 300px;
    height: 40px;
    text-align: center;
    line-height: 40px;
    font-size: 16px;
    border-radius: 3px;
    background-color: beige;
}
</style>