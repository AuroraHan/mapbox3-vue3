<!--  -->
<template>
    <div class="continer">
        <div id="cesiumContainer"></div>
        <div id="ThreeContainer"></div>
    </div>
</template>

<script setup lang='ts'>
import { onMounted } from 'vue'
import * as Cesium from "cesium";
import * as THREE from 'three';

let minWGS84 = [115.23, 39.55];
let maxWGS84 = [116.23, 41.55];

let three = {
    renderer: null,
    camera: null,
    scene: null,
}

let cesium = {
    viewer: null,
}
let cesiumContainer
let ThreeContainer
onMounted(() => {
    cesiumContainer = document.getElementById('cesiumContainer')
    ThreeContainer = document.getElementById('ThreeContainer')
    initCesium()
    initThree()
    init3DObject()
    loop()
})

let objects3D = [];// Could be any Three.js object mesh
let ce;


class Object3D {
    threeMesh: THREE.Mesh;
    minWGS84: any;
    maxWGS84: any;
    constructor(mesh: THREE.Mesh, minWGS84, maxWGS84) {
        this.threeMesh = mesh; // Three.js 3DObject.mesh
        this.minWGS84 = minWGS84; // location bounding box
        this.maxWGS84 = maxWGS84;
    }
}

const initCesium = () => {
    Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwNzk3NjkyMy1iNGI1LTRkN2UtODRiMy04OTYwYWE0N2M3ZTkiLCJpZCI6Njk1MTcsImlhdCI6MTYzMzU0MTQ3N30.e70dpNzOCDRLDGxRguQCC-tRzGzA-23Xgno5lNgCeB4";
    cesium.viewer = new Cesium.Viewer('cesiumContainer', {
        useDefaultRenderLoop: false,
        selectionIndicator: false,
        homeButton: false,
        sceneModePicker: false,
        infoBox: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        baseLayerPicker: false,

        contextOptions: {
            webgl: {
                alpha: false,
                antialias: true,
                preserveDrawingBuffer: true,
                failIfMajorPerformanceCaveat: false,
                depth: true,
                stencil: false,
                anialias: false,
            },
        },

        targetFrameRate: 60,
        // resolutionScale: 0.1,
        orderIndependentTranslucency: true,
        geocoder: false,
        automaticallyTrackDataSourceClocks: false,
        // creditContainer : "hidecredit", // Cannot read properties of null (reading 'appendChild')
        dataSources: undefined,
        terrainShadows: Cesium.ShadowMode.DISABLED,
    })

    const center = Cesium.Cartesian3.fromDegrees(
        (minWGS84[0] + maxWGS84[0]) / 2,
        ((minWGS84[1] + maxWGS84[1]) / 2) - 1,
        200000
    );

    ce = center
    cesium.viewer?.camera.flyTo({
        destination: center,
        // orientation: {
        //     heading: Cesium.Math.toRadians(0),
        //     pitch: Cesium.Math.toRadians(-60),
        //     roll: Cesium.Math.toRadians(0),
        // },
        duration: 3,
    })
}

const initThree = () => {
    let fov = 45
    let width = window.innerWidth
    let height = window.innerHeight
    let aspect = width / height
    let near = 1
    let far = 10 * 1000 * 1000
    three.scene = new THREE.Scene()
    three.camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    three.renderer = new THREE.WebGLRenderer({ alpha: true })
    three.renderer.setPixelRatio(window.devicePixelRatio);
    three.renderer.setSize(window.innerWidth, window.innerHeight);
    var Amlight = new THREE.AmbientLight(0xffffff, 2);
    // debugger
    three.scene.add(Amlight);
    ThreeContainer.appendChild(three.renderer.domElement)

}

const init3DObject = () => {

    var entity = {
        name: 'Polygon',
        polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray([
                minWGS84[0], minWGS84[1],
                maxWGS84[0], minWGS84[1],
                maxWGS84[0], maxWGS84[1],
                minWGS84[0], maxWGS84[1],
            ]),
            material: Cesium.Color.RED.withAlpha(0.2)
        }
    };
    cesium.viewer.entities.add(entity);

    //创建three球体
    let geometry1 = new THREE.SphereGeometry(1000, 32, 32);
    let sphere = new THREE.Mesh(geometry1, new THREE.MeshPhongMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide
    }));
    sphere.scale.set(5000, 5000, 5000); //网格模型xyz方向都缩放5000倍
    sphere.uuid = "sphere";
    //创建组对象group
    var group = new THREE.Group();
    group.add(sphere);  //把球体添加到组
    three.scene.add(group); //把组添加到场景中
    // group.position.set(ce.x, ce.y, ce.z);   //设置组的位置
    // group.position.copy(new THREE.Vector3(0, 0, 0)); // 放在相机中心

    const cart = Cesium.Cartesian3.fromDegrees(
        (minWGS84[0] + maxWGS84[0]) / 2,
        (minWGS84[1] + maxWGS84[1]) / 2,
        100000
    );
    group.position.set(cart.x, cart.y, cart.z);


    let ob3D = new Object3D(group, minWGS84, maxWGS84);
    objects3D.push(ob3D);

    //添加点光源
    // var spotLight = new THREE.SpotLight(0xffffff);
    // spotLight.position.set(0, 0, 50000);
    // spotLight.castShadow = true; //设置光源投射阴影
    // spotLight.intensity = 1;
    // group.add(spotLight)
    // //添加环境光
    // var hemiLight = new THREE.HemisphereLight(0xff0000, 0xff0000, 1);
    // group.add(hemiLight);
}

const renderCesium = () => {
    cesium.viewer.render()
}

const renderThreeObj = () => {
    // let Cesium = this.Cesium;
    let ThreeContainer = document.getElementById("ThreeContainer");
    // 设置相机跟cesium保持一致,使用的cesium的相机为主相机，使three的相机与cesium保持一致即可
    three.camera.fov = Cesium.Math.toDegrees(cesium.viewer.camera.frustum.fovy)
    three.camera.updateProjectionMatrix();
    // three.camera.updateProjectionMatrix();
    let cartToVec = function (cart) {
        return new THREE.Vector3(cart.x, cart.y, cart.z)
    }

    // Configure Three.js meshes to stand against globe center position up direction
    for (let id in objects3D) {
        let minWGS84 = objects3D[id].minWGS84;
        let maxWGS84 = objects3D[id].maxWGS84;
        // 物体中心位置计算为对象的最小和最大WGS84纬度和经度值的平均值，并且把经纬度坐标（WGS84）转笛卡尔坐标
        var center = Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2);

        // 向前方向计算为高度为1的Cartesian3位置，以便对象指向远离地球中心的方向
        var centerHigh = Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2, 1);

        // 使用 WGS84 区域从左下角到左上角的方向作为向上矢量
        var bottomLeft = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[0], minWGS84[1]));
        var topLeft = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[0], maxWGS84[1]));
        var latDir = new THREE.Vector3().subVectors(bottomLeft, topLeft).normalize();

        // 物体位置调整
        objects3D[id].threeMesh.position.copy(center); //位置设置为中心位置
        //_3Dobjects[id].threeMesh.lookAt(centerHigh);    // threejs-r87版本 
        //threejs-r87以上版本，需改写成如下
        objects3D[id].threeMesh.lookAt(centerHigh.x, centerHigh.y, centerHigh.z);
        objects3D[id].threeMesh.up.copy(latDir);   //网格的向上矢量设置为计算出的向上矢量方向
    }
    // Clone Cesium Camera projection position so the
    // Three.js Object will appear to be at the same place as above the Cesium Globe
    //关闭相机自动更新

    // cesium相机位置
    var cvm = cesium.viewer.camera.viewMatrix;
    var civm = cesium.viewer.camera.inverseViewMatrix;
    //NOTE:r87后版本，threejs源码中相机的lookat重新调整了矩阵，需要将原来放在相机设置参数前的这行代码上移到此处
    three.camera.lookAt(new THREE.Vector3(0, 0, 0));
    // 同步Three相机位置设置
    // three.camera.matrixWorld.set(
    //     civm[0], civm[4], civm[8], civm[12],
    //     civm[1], civm[5], civm[9], civm[13],
    //     civm[2], civm[6], civm[10], civm[14],
    //     civm[3], civm[7], civm[11], civm[15]
    // );
    // three.camera.matrixWorldInverse.set(
    //     cvm[0], cvm[4], cvm[8], cvm[12],
    //     cvm[1], cvm[5], cvm[9], cvm[13],
    //     cvm[2], cvm[6], cvm[10], cvm[14],
    //     cvm[3], cvm[7], cvm[11], cvm[15]
    // );
    three.camera.matrixWorld.set(
        civm[0], civm[1], civm[2], civm[3],
        civm[4], civm[5], civm[6], civm[7],
        civm[8], civm[9], civm[10], civm[11],
        civm[12], civm[13], civm[14], civm[15]
    );

    three.camera.matrixWorldInverse.set(
        cvm[0], cvm[1], cvm[2], cvm[3],
        cvm[4], cvm[5], cvm[6], cvm[7],
        cvm[8], cvm[9], cvm[10], cvm[11],
        cvm[12], cvm[13], cvm[14], cvm[15]
    );

    three.camera.matrixAutoUpdate = false;


    let width = cesiumContainer.clientWidth
    let height = cesiumContainer.clientHeight
    let aspect = width / height

    three.camera.aspect = aspect
    three.camera.updateProjectionMatrix()
    three.renderer.setSize(width, height)
    // three.renderer.clear()
    three.renderer.render(three.scene, three.camera)
}

const loop = () => {
    requestAnimationFrame(loop)
    renderCesium()
    renderThreeObj()
}
</script>
<style scoped lang='scss'>
.continer {
    height: 100vh;

}

#cesiumContainer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    z-index: 1;
}

.cesium-viewer .cesium-widget-credits {
    display: none;
}

#ThreeContainer canvas {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    z-index: 2;
}
</style>