<template>
    <div></div>
</template>

<script setup>
import { onMounted } from 'vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

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
    scene.add(model)
}
</script>

<style scoped></style>