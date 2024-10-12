import { createRouter, createWebHashHistory } from "vue-router";


const routes = [
    { path: "/", component: () => import('@/views/addImages/index.vue') },
    { path: "/addImages", name: 'addImages', component: () => import('@/views/addImages/index.vue') },

];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export { router };