<template>
    <div id="cesiumContainer"></div>
    <div class="flex-box" @click="loadModel">加载模型查看历史</div>
    <div class="flex-box" style="top: 9%;" @click="addCzml">加载单个飞行</div>
    <div class="flex-box" style="top: 15%;" @click="singModelFly">案例三</div>
    <div class="flex-box" style="top: 21%;" @click="randomPos">多模型加载</div>

    <!-- 弹出框 -->
    <CesiumDialog :show="isOpen" @exportCesium="exportCesium" @closeDialog="closeDialog"></CesiumDialog>
    <MyDialog ref="mydialog" :positionXY="pos" @showHistory="showHistory"></MyDialog>
</template>

<script lang='ts' setup>
import { onMounted, ref, reactive, watch } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import CesiumDialog from '/@/components/cesiumDialog/index.vue'
import MyDialog from '/@/components/cesiumPopupTwo/index.vue';

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', timeline: true, animation: true, shouldAnimate: true })

onMounted(() => {
    baseConfig()
})

//基础配置
const baseConfig = () => {
    cesiumV = getCesiumViewer()

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

/* 第一个方法 */

//加载一组模型配置
const entityList: Array<Cesium.Entity> = []
const pos = reactive({
    xAxis: 0,
    yAxis: 0
})
const mydialog = ref()
const loadModel = () => {
    const list = [
        {
            id: 'hc1',
            name: '航测1号',
            url: '/models/Cesium_Air.glb',
            position: Cesium.Cartesian3.fromDegrees(120, 31, 4500)
        },
        {
            id: 'wrj1',
            name: '无人机1号',
            url: '/models/CesiumDrone.glb',
            position: Cesium.Cartesian3.fromDegrees(114, 29, 4000)
        },
        {
            id: 'kt1',
            name: '空投1号',
            url: '/models/CesiumBalloon.glb',
            position: Cesium.Cartesian3.fromDegrees(122, 27, 5500)
        },
        {
            id: 'jcz1',
            name: '监测站1号',
            url: '/models/CesiumMilkTruck.glb',
            position: Cesium.Cartesian3.fromDegrees(113, 23, 0)
        }
    ]

    const heading = Cesium.Math.toRadians(-90);
    const pitch = 0;
    const roll = 0;
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);


    for (const ele of list) {
        const entity = cesiumV.entities.add({
            id: ele.id,
            name: ele.name,
            position: ele.position,
            orientation: Cesium.Transforms.headingPitchRollQuaternion(ele.position, hpr),
            label: {
                text: ele.name,
                pixelOffset: new Cesium.Cartesian2(30, 33),
                font: '18px Microsoft YaHei Bold',
                fillColor: Cesium.Color.GREENYELLOW
            },
            model: {
                uri: ele.url,
                minimumPixelSize: 92,
                maximumScale: 20000,
            }
        })

        entityList.push(entity)
    }

    let handle = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas)
    handle.setInputAction((clickEvent: any) => {
        let pickData = cesiumV.scene.pick(clickEvent.position)

        //存在则打开弹出框
        if (Cesium.defined(pickData)) {
            let scratch = new Cesium.Cartesian2();
            cesiumV.scene.preRender.addEventListener(() => {
                //获取模型的坐标数据
                const modelPos = pickData.primitive.id.position.getValue()
                let position = new Cesium.Cartesian3(modelPos.x, modelPos.y, modelPos.z);
                let canvasPosition = cesiumV.scene.cartesianToCanvasCoordinates(position, scratch);

                if (Cesium.defined(canvasPosition)) {
                    pos.xAxis = canvasPosition.x - 100
                    pos.yAxis = canvasPosition.y - 70
                }
            })

            mydialog.value.openDialog()
        } else {
            mydialog.value.closeDialog()
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // dynamicPos()
}

const isOpen = ref(false)

const showHistory = () => {
    isOpen.value = true
}

//暴露的方法
const exportCesium = (v: any) => {
    addCzml(v)
}

//关闭弹出框的回调
const closeDialog = () => {
    isOpen.value = false
}

//进行动态更新
const dynamicPos = () => {
    setInterval(() => {
        cesiumV.entities.suspendEvents();
        entityList.forEach((entity) => {
            //方法一
            entity.position = getRandomPos()

        })
        cesiumV.entities.suspendEvents();
    }, 4000)

}


const getRandomPos = () => {
    return Cesium.Cartesian3.fromDegrees(100 + Math.random() * 22, 20 + Math.random() * 16, Math.random() * 3000)
}

/* 第二个方法 */
//加载单个模型数据
const addCzml = async (cesiumV: Cesium.Viewer) => {
    const dataSource = await cesiumV.dataSources.add(Cesium.CzmlDataSource.load(czml));
    cesiumV.trackedEntity = dataSource.entities.getById('wrj')
    // cesiumV.trackingReferenceFrame = Cesium.TrackingReferenceFrame.AUTODETECT;
}

const czml = [
    {
        id: "document",
        name: "CZML Path",
        version: "1.0",
        clock: {
            interval: "2025-04-28T10:37:10Z/2025-04-28T10:38:50Z",
            currentTime: "2025-04-28T10:37:10Z",
            multiplier: 1,
        },
    },
    {
        id: 'wrj',
        availability: "2025-04-28T10:37:10Z/2025-04-28T10:38:50Z",
        path: {
            material: {
                polylineOutline: {
                    color: {
                        rgba: [255, 0, 255, 255],
                    },
                    outlineColor: {
                        rgba: [0, 255, 255, 255],
                    },
                    outlineWidth: 5,
                },
            },
            width: 8,
            // leadTime: 10,
            // trailTime: 1000,
            // resolution: 5,
        },
        label: {
            text: "无人机1号",
            pixelOffset: {
                "cartesian2": [
                    18.0, 35.0
                ]
            },
        },
        cylinder: {
            length: 2000, //圆柱体的长度
            topRadius: 0, //顶部半径
            bottomRadius: 800,
            outlineColor: Cesium.Color.RED,
        },
        // billboard: {
        //     image:
        //         "data:image/png;base64,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",
        //     scale: 2.5,
        //     eyeOffset: {
        //         cartesian: [0.0, 0.0, -10.0],
        //     },
        // },
        model: {
            gltf: "/models/CesiumDrone.glb",
            scale: 2.0,
            minimumPixelSize: 128,
        },
        orientation: {
            "velocityReference": "#position"
        },
        position: {
            epoch: "2025-04-28T10:37:10Z",
            cartographicDegrees: [
                0, 113.28328631492639, 23.111433215435753, 1500,
                5, 113.50714976568543, 23.694634169248147, 2000,
                10, 113.6299135935181, 24.169871656793887, 2500,
                15, 113.70934901152907, 24.85320754694945, 3000,
                20, 113.65157704589103, 25.61746954483914, 3500,
                25, 113.49150502960089, 26.297929565617395, 4000,
                30, 113.32225282991868, 26.919159149253858, 4500,
                35, 112.96275429879444, 27.54911441094461, 5000,
                40, 112.9449382777749, 28.234076869525722, 5500,
                45, 112.8784720236336, 28.543897602427435, 6000,
                50, 112.92669944031508, 29.130070639697294, 6500,
                55, 113.14372281537442, 29.697212026021546, 7000,
                60, 113.43308669785722, 30.07354009292432, 7500,
                65, 113.74053647919294, 30.38085734849267, 8000,
                70, 114.17458307056592, 30.583470562015506, 8000,
                75, 114.86182323969172, 30.899530905574252, 8000,
                80, 115.597291344067, 31.30215750288525, 8000,
                85, 116.22424543023169, 31.641504716189345, 7000,
                90, 117.20407629814952, 31.812939039523783, 6000,
                95, 118.31626581796667, 32.256622831560406, 5500,
                100, 118.54273109813403, 33.02364879361495, 5000,
            ]
        }
    }
]


/* 第三个方法 */
//单个模型动态飞行
const singModelFly = () => {
    const julianDT = new Cesium.JulianDate();
    const start = Cesium.JulianDate.addHours(Cesium.JulianDate.fromDate(new Date(2025, 5, 9, 8)), 8, julianDT); // 调整为北京时间
    const duration = 4;
    const stop = Cesium.JulianDate.addSeconds(
        start,
        duration,
        new Cesium.JulianDate(),
    );

    //设置时钟时间
    cesiumV.clock.startTime = start.clone()
    cesiumV.clock.stopTime = stop.clone()
    cesiumV.clock.currentTime = start.clone();
    cesiumV.clock.multiplier = 1.0;
    cesiumV.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    cesiumV.clock.shouldAnimate = true;

    cesiumV.timeline.zoomTo(start, stop);

    // Prepare time samples.
    const times = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
    const firstTime = times[0];
    const lastTime = times[times.length - 1];
    const delta = lastTime - firstTime;

    // Prepare point samples. Before and after points are used to
    // calculate the first and last tangents for the spline.
    const before = Cesium.Cartesian3.fromDegrees(-112.87962, 36.27375, 620.01);
    const points = [
        Cesium.Cartesian3.fromDegrees(-112.87709, 36.27782, 620.01),
        Cesium.Cartesian3.fromDegrees(-112.87351, 36.27992, 617.9),
        Cesium.Cartesian3.fromDegrees(-112.87081, 36.2816, 617.6),
        Cesium.Cartesian3.fromDegrees(-112.86539, 36.28239, 625.36),
        Cesium.Cartesian3.fromDegrees(-112.86108, 36.28137, 627.82),
        Cesium.Cartesian3.fromDegrees(-112.85551, 36.27967, 625.54),
        Cesium.Cartesian3.fromDegrees(-112.848, 36.27732, 628.9),
        Cesium.Cartesian3.fromDegrees(-112.84086, 36.27739, 638.81),
        Cesium.Cartesian3.fromDegrees(-112.83682, 36.27995, 643.31),
    ];
    const after = Cesium.Cartesian3.fromDegrees(-112.83506, 36.2822, 643.31);

    // Calculate first and last tangents.
    const firstTangent = Cesium.Cartesian3.subtract(
        points[0],
        before,
        new Cesium.Cartesian3(),
    );
    const lastTangent = Cesium.Cartesian3.subtract(
        after,
        points[8],
        new Cesium.Cartesian3(),
    );

    // Create the position spline.
    const positionSpline = new Cesium.CatmullRomSpline({
        times: times,
        points: points,
        firstTangent: firstTangent,
        lastTangent: lastTangent,
    });

    // Create the callback position property and make it return spline evaluations.
    const position = new Cesium.CallbackPositionProperty(function (time, result) {
        const splineTime =
            (delta * Cesium.JulianDate.secondsDifference(time, start)) / duration;
        if (splineTime < firstTime || splineTime > lastTime) {
            return undefined;
        }
        return positionSpline.evaluate(splineTime, result);
    }, false);

    const orientation = new Cesium.VelocityOrientationProperty(position);

    // Add a waypoints.
    for (let i = 0; i < points.length; ++i) {
        cesiumV.entities.add({
            position: points[i],
            point: {
                pixelSize: 8,
                color: Cesium.Color.TRANSPARENT,
                outlineColor: Cesium.Color.YELLOW,
                outlineWidth: 3,
            },
        });
    }

    // Create the entity and bind its position to the callback position property
    const entity = cesiumV.entities.add({
        availability: new Cesium.TimeIntervalCollection([
            new Cesium.TimeInterval({
                start: start,
                stop: stop,
            }),
        ]),
        position: position,
        orientation: orientation,
        model: {
            uri: "/models/CesiumDrone.glb",
            minimumPixelSize: 128,
            maximumScale: 20000,
        },
        path: {
            material: new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.1,
                color: Cesium.Color.YELLOW,
            }),
            width: 10,
            resolution: 0.01,
            leadTime: 1,
            trailTime: 0.1,
        },
        trackingReferenceFrame: Cesium.TrackingReferenceFrame.INERTIAL,
        viewFrom: new Cesium.Cartesian3(-100, 0, 10),
    });

    cesiumV.trackedEntity = entity;
}

//多个模型在地图上加载
const multiModel = async () => {
    const mulCzml = [
        {
            id: "document",
            name: "CZML Path",
            version: "1.0",
            // clock: {
            //     interval: "2025-04-28T10:37:10Z/2025-04-28T10:38:50Z",
            //     currentTime: "2025-04-28T10:37:10Z",
            //     multiplier: 1,
            // },
        },
        {
            id: 'wrj',
            availability: "2025-04-28T10:37:10Z/2025-04-28T10:38:50Z",
            path: {
                material: {
                    polylineOutline: {
                        color: {
                            rgba: [255, 0, 255, 255],
                        },
                        outlineColor: {
                            rgba: [0, 255, 255, 255],
                        },
                        outlineWidth: 5,
                    },
                },
                width: 8,
            },
            label: {
                text: "无人机1号",
                pixelOffset: {
                    "cartesian2": [
                        18.0, 35.0
                    ]
                },
            },
            model: {
                gltf: "/models/CesiumDrone.glb",
                scale: 2.0,
                minimumPixelSize: 128,
            },
            orientation: {
                "velocityReference": "#position"
            },
            position: {
                epoch: "2025-04-28T10:37:10Z",
                cartographicDegrees: [
                    0, 113.28328631492639, 23.111433215435753, 1500,
                    5, 113.50714976568543, 23.694634169248147, 2000,
                    10, 113.6299135935181, 24.169871656793887, 2500,
                    15, 113.70934901152907, 24.85320754694945, 3000,
                    20, 113.65157704589103, 25.61746954483914, 3500,
                    25, 113.49150502960089, 26.297929565617395, 4000,
                    30, 113.32225282991868, 26.919159149253858, 4500,
                    35, 112.96275429879444, 27.54911441094461, 5000,
                    40, 112.9449382777749, 28.234076869525722, 5500,
                    45, 112.8784720236336, 28.543897602427435, 6000,
                    50, 112.92669944031508, 29.130070639697294, 6500,
                    55, 113.14372281537442, 29.697212026021546, 7000,
                    60, 113.43308669785722, 30.07354009292432, 7500,
                    65, 113.74053647919294, 30.38085734849267, 8000,
                    70, 114.17458307056592, 30.583470562015506, 8000,
                    75, 114.86182323969172, 30.899530905574252, 8000,
                    80, 115.597291344067, 31.30215750288525, 8000,
                    85, 116.22424543023169, 31.641504716189345, 7000,
                    90, 117.20407629814952, 31.812939039523783, 6000,
                    95, 118.31626581796667, 32.256622831560406, 5500,
                    100, 118.54273109813403, 33.02364879361495, 5000,
                ]
            }
        },
        {
            id: 'hc',
            availability: "2025-04-28T10:37:10Z/2025-04-28T10:38:50Z",
            path: {
                material: {
                    polylineOutline: {
                        color: {
                            rgba: [255, 0, 255, 255],
                        },
                        outlineColor: {
                            rgba: [0, 255, 255, 255],
                        },
                        outlineWidth: 5,
                    },
                },
                width: 8,
            },
            label: {
                text: "航测1号",
                pixelOffset: {
                    "cartesian2": [
                        18.0, 35.0
                    ]
                },
            },
            model: {
                gltf: "/models/Cesium_Air.glb",
                scale: 2.0,
                minimumPixelSize: 128,
            },
            orientation: {
                "velocityReference": "#position"
            },
            position: {
                epoch: "2025-04-28T10:37:10Z",
                cartographicDegrees: [
                    0, 113.7923396363662, 23.106990160005353, 1500,
                    5, 114.28048350624312, 23.739311443864054, 2000,
                    10, 114.82468623840595, 24.484386889937966, 2500,
                    15, 115.31806092785678, 25.663489133757224, 3000,
                    20, 116.04843929319111, 26.710839538617932, 3500,
                    25, 116.069918991115, 27.761318438407528, 4000,
                    30, 116.93720744983318, 28.8409109572179, 4500,
                    35, 118.24769147243478, 29.715664149451882, 5000,
                    40, 119.13560153143925, 30.787055778457216, 5500,
                    // 45, 112.8784720236336, 28.543897602427435, 6000,
                    // 50, 112.92669944031508, 29.130070639697294, 6500,
                    // 55, 113.14372281537442, 29.697212026021546, 7000,
                    // 60, 113.43308669785722, 30.07354009292432, 7500,
                    // 65, 113.74053647919294, 30.38085734849267, 8000,
                    // 70, 114.17458307056592, 30.583470562015506, 8000,
                    // 75, 114.86182323969172, 30.899530905574252, 8000,
                    // 80, 115.597291344067, 31.30215750288525, 8000,
                    // 85, 116.22424543023169, 31.641504716189345, 7000,
                    // 90, 117.20407629814952, 31.812939039523783, 6000,
                    // 95, 118.31626581796667, 32.256622831560406, 5500,
                    // 100, 118.54273109813403, 33.02364879361495, 5000,
                ]
            }
        }
    ]

    const dataSource = await cesiumV.dataSources.add(Cesium.CzmlDataSource.load(mulCzml));
    // cesiumV.trackedEntity = dataSource.entities.getById('hc')
}

//生成位置信息
const dataModel = reactive({
    longitude: 112,
    latitude: 31,
    height: 1000,
    timestamp: new Date()
})
//随机生成位置
const randomPos = () => {
    let longitude = 112;
    let latitude = 31;
    let height = 1000;

    const position = new Cesium.SampledPositionProperty()
    const orientation = new Cesium.VelocityOrientationProperty(position)

    const entity = cesiumV.entities.add({
        id: 'model1',
        model: {
            uri: "/models/CesiumDrone.glb",
            // scale: 2.0,
            minimumPixelSize: 128,
        },
        path: {
            material: Cesium.Color.RED,
            width: 8,
        },
        position,
        orientation
    })

    // 添加初始位置
    const initialTime = Cesium.JulianDate.fromDate(dataModel.timestamp)
    const initialPosition = Cesium.Cartesian3.fromDegrees(
        dataModel.longitude,
        dataModel.latitude,
        dataModel.height
    )
    position.addSample(initialTime, initialPosition)

    // 配置Viewer时钟
    cesiumV.clock.startTime = initialTime.clone()
    cesiumV.clock.stopTime = Cesium.JulianDate.addSeconds(
        initialTime,
        3600,
        new Cesium.JulianDate()
    )
    cesiumV.clock.currentTime = initialTime.clone()
    cesiumV.clock.clockRange = Cesium.ClockRange.LOOP_STOP
    cesiumV.clock.multiplier = 1

    // cesiumV.trackedEntity = entity

    setInterval(() => {
        dataModel.longitude = longitude += 0.01 * (Math.random() - 0.3);
        dataModel.latitude = latitude += 0.01 * (Math.random() - 0.2);
        dataModel.height = height += 10 * (Math.random() - 0.5);
        dataModel.timestamp = new Date()
        console.log(dataModel.longitude);

    }, 1500)
}

watch(dataModel, (newVal) => {
    const { longitude, latitude, height, timestamp } = newVal
    const moEntity = cesiumV.entities.getById('model1')

    const t = Cesium.JulianDate.fromDate(timestamp)
    const coordinate = Cesium.Cartesian3.fromDegrees(longitude, latitude, height,)
    moEntity.position.addSample(t, coordinate)
    // 更新时钟范围
    if (Cesium.JulianDate.compare(t, cesiumV.clock.stopTime) > 0) {
        cesiumV.clock.stopTime = t.clone()
    }
})

</script>
<style lang='scss' scoped>
#cesiumContainer {
    height: 100vh;
}

.flex-box {
    position: absolute;
    top: 3%;
    left: 4%;
    min-width: 40px;
    line-height: 40px;
    padding: 4px;
    height: 40px;
    background-color: goldenrod;
    z-index: 9;
    border-radius: 4px;
    cursor: pointer;
    color: #fff;
}
</style>