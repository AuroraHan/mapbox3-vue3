import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  { path: "/", component: () => import("@/views/baseBox/index.vue") },
  {
    path: "/baseBox",
    name: "baseBox",
    component: () => import("@/views/baseBox/index.vue"),
  },
  {
    path: "/basePage",
    name: "basePage",
    component: () => import("@/views/basePage/index.vue"),
  },
  {
    path: "/mapBoxBase",
    name: "mapBoxBase",
    component: () => import("@/views/mapBoxBase/index.vue"),
  },
  {
    path: "/popup",
    name: "popup",
    component: () => import("@/views/popup/index.vue"),
  },
  {
    path: "/mapboxLayer",
    name: "mapboxLayer",
    component: () => import("@/views/mapboxLayer/index.vue"),
  },
  {
    path: "/mapboxVector",
    name: "mapboxVector",
    component: () => import("@/views/mapBoxVector/index.vue"),
  },
  {
    path: "/baseThreeBox",
    name: "baseThreeBox",
    component: () => import("@/views/baseThreeBox/index.vue"),
  },
  {
    path: "/baseThree",
    name: "baseThree",
    component: () => import("@/views/baseThree/index.vue"),
  },
  {
    path: "/mapBoxAircraft",
    name: "mapBoxAircraft",
    component: () => import("@/views/mapBoxAircraft/index.vue"),
  },
  {
    path: "/baseCesium",
    name: "baseCesium",
    component: () => import("@/views/baseCesium/index.vue"),
  },
  {
    path: "/mapboxL7",
    name: "mapboxL7",
    component: () => import("@/views/mapBoxL7/index.vue"),
  },
  {
    path: "/mapboxWind",
    name: "mapboxWind",
    component: () => import("@/views/mapboxWind/index.vue"),
  },
  {
    path: "/cesiumPopup",
    name: "cesiumPopup",
    component: () => import("@/views/cesiumPopup/index.vue"),
  },
  {
    path: "/cesiumMeasure",
    name: "cesiumMeasure",
    component: () => import("@/views/cesiumMeasure/index.vue"),
  },
  {
    path: "/cesiumVoxel",
    name: "cesiumVoxel",
    component: () => import("@/views/cesiumVoxel/index.vue"),
  },
  {
    path: "/cesiumVoxelBox",
    name: "cesiumVoxelBox",
    component: () => import("@/views/cesiumVoxelBox/index.vue"),
  },
  {
    path: "/cesiumCluster",
    name: "cesiumCluster",
    component: () => import("@/views/cesiumCluster/index.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export { router };
