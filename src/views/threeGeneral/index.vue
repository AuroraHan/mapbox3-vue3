<template>
    <div></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import * as THREE from 'three';
//@ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'

let camera: THREE.Camera,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    controls: any;


onMounted(() => {
    loadGLTF()
})

const loadGLTF = () => {
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

    loadModel()

    function animate() {
        renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(animate);
}

const loadModel = async () => {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('/models/aim-9_missile/scene.gltf')
    const model = gltf.scene
    model.scale.set(100, 100, 100)
    scene.add(model)

    // --- 1️⃣ 计算模型包围盒 ---
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);


    // --- 2️⃣ 创建外层包裹 Mesh ---
    const wrapperGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const wrapperMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
    });
    const wrapper = new THREE.Mesh(wrapperGeometry, wrapperMaterial);
    wrapper.position.copy(center);

    // --- 3️⃣ 调整模型，使其中心与外层 Mesh 对齐 ---
    model.position.sub(center);
    wrapper.add(model);

    scene.add(wrapper)
    objs.push(wrapper)

    dragModel()
}
const objs: Array<THREE.Object3D> = []
let dragControls: DragControls;
let transformControls: TransformControls;
const dragModel = () => {

    transformControls = new TransformControls(camera, renderer.domElement);
    // transformControls.setMode('rotate')
    //特别注意
    scene.add(transformControls.getHelper());

    dragControls = new DragControls(objs, camera, renderer.domElement)
    //当开始拖拽时，禁用 OrbitControls
    dragControls.addEventListener('dragstart', function (event) {
        controls.enabled = false
    })

    // 鼠标略过事件
    dragControls.addEventListener('hoveron', function (event) {
        // 让变换控件对象和选中的对象绑定
        transformControls.attach(event.object);
    })

    // 拖拽中

    dragControls.addEventListener('drag', function (event) {
        // event.object.position.y = Math.max(event.object.position.y, 0)
        controls.enabled = false
    })

    // 拖拽结束后恢复 OrbitControls
    dragControls.addEventListener('dragend', function (event) {
        controls.enabled = true;
        transformControls.detach()
    })
}
</script>

<style scoped></style>