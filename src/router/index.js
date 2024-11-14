import { createRouter, createWebHashHistory } from "vue-router";


const routes = [
    { path: "/", component: () => import('@/views/mapBoxBase/index.vue') },
    { path: "/mapBoxBase", name: 'addImages', component: () => import('@/views/mapBoxBase/index.vue') },
    { path: "/popup", name: 'popup', component: () => import('@/views/popup/index.vue') },
    { path: "/mapboxLayer", name: 'mapboxLayer', component: () => import('@/views/mapboxLayer/index.vue') },
    { path: "/mapboxVector", name: 'mapboxVector', component: () => import('@/views/mapBoxVector/index.vue') },
    { path: "/baseThreeBox", name: 'baseThreeBox', component: () => import('@/views/baseThreeBox/index.vue') },
    { path: "/baseThree", name: 'baseThree', component: () => import('@/views/baseThree/index.vue') },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export { router };