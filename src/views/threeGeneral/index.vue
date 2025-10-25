<template>
    <div></div>
</template>

<script setup>
import { onMounted } from 'vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DragControls } from 'three/examples/jsm/controls/DragControls';

let camera, scene, renderer, controls;
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
    model.position.set(0, 100, 0)
    model.scale.set(100, 100, 100)
    // scene.add(model)


    const missileGroup = new THREE.Group()
    missileGroup.add(model)
    scene.add(missileGroup)
    objs.push(missileGroup)

    dragModel()
}
const objs = []
let dragControls;
const dragModel = () => {
    let currentGroup;
    dragControls = new DragControls(objs, camera, renderer.domElement)
    //当开始拖拽时，禁用 OrbitControls
    dragControls.addEventListener('dragstart', function (event) {
        controls.enabled = false
        // ✅ 无论点中子mesh还是group，找到最外层Group
        currentGroup = event.object
        while (currentGroup && !(currentGroup instanceof THREE.Group)) {
            currentGroup = currentGroup.parent
        }
    })

    // 拖拽中
    dragControls.addEventListener('drag', function (event) {
        // event.object 是被拖拽的模型对象
        // 你可以在这里限制拖拽范围
        // 例如：
        // event.object.position.y = Math.max(event.object.position.y, 0)
        if (currentGroup) {
            // 将 drag 中的偏移应用到最外层 Group
            currentGroup.position.copy(event.object.position)
        }
    })

    // 拖拽结束后恢复 OrbitControls
    dragControls.addEventListener('dragend', function (event) {
        controls.enabled = true
        currentGroup = null
    })
}
</script>

<style scoped></style>