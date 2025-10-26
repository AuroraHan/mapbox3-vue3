<template>
    <div></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import * as THREE from 'three';
//@ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'

let camera: THREE.Camera,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    controls: any;


onMounted(() => {
    initThree()
})

const initThree = () => {
    const { innerWidth, innerHeight } = window;

    camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 5000);
    camera.position.set(0, 1000, 2000);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff)

    const helper = new THREE.GridHelper(3000, 50, 0x303030, 0x303030);
    scene.add(helper);

    // const geometry = new THREE.BoxGeometry(100, 100, 100);
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // const cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);

    // const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    // scene.add(ambient)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
    controls.addEventListener('change', render)

    loadModel()

    function animate() {
        render()
    }
    renderer.setAnimationLoop(animate);
}

const render = () => {
    renderer.render(scene, camera);
}

//拖拽模型最简单方法
let transformControls: TransformControls;
const loadModel = async () => {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('/models/aim-9_missile/scene.gltf')
    const model = gltf.scene
    model.scale.set(100, 100, 100)
    scene.add(model)

    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('change', render);
    transformControls.addEventListener('dragging-changed', function (event) {
        controls.enabled = !event.value;
    });
    transformControls.attach(model);

    const gizmo = transformControls.getHelper();
    scene.add(gizmo);
}

//模型飞行效果
const modelFly = () => {

}
</script>

<style scoped></style>