<template>
    <div></div>
</template>

<script setup>
import { onMounted } from 'vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let camera, scene, renderer, controls;
onMounted(() => {
    loadGLTF()
})

const loadGLTF = () => {
    const { innerWidth, innerHeight } = window;

    camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 5000);
    camera.position.set(0, 1000, 2000);

    scene = new THREE.Scene();

    const helper = new THREE.GridHelper(3000, 50, 0x303030, 0x303030);
    scene.add(helper);

    const geometry = new THREE.BoxGeometry(100, 100, 100);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);


    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();


    function animate() {
        renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(animate);
}
</script>

<style scoped></style>