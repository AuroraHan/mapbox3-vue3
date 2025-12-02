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
    path: "/basePageTwo",
    name: "basePageTwo",
    component: () => import("@/views/basePageTwo/index.vue"),
  },
  {
    path: "/mapBoxBase",
    name: "mapBoxBase",
    component: () => import("@/views/mapBoxBase/index.vue"),
  },
  {
    path: "/mapBoxGeneral",
    name: "mapBoxGeneral",
    component: () => import("@/views/mapBoxGeneral/index.vue"),
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
    path: "/threeGeneral",
    name: "threeGeneral",
    component: () => import("@/views/threeGeneral/index.vue"),
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
    path: "/mapboxShader",
    name: "mapboxShader",
    component: () => import("@/views/mapboxShader/index.vue"),
  },
  {
    path: "/mapBoxGaoDe",
    name: "mapBoxGaoDe",
    component: () => import("@/views/mapBoxGaoDe/index.vue"),
  },
  {
    path: "/mapBoxTravel",
    name: "mapBoxTravel",
    component: () => import("@/views/mapBoxTravel/index.vue"),
  },
  {
    path: "/mapboxThree",
    name: "mapboxThree",
    component: () => import("@/views/mapboxThree/index.vue"),
  },
  {
    path: "/mapboxPopup",
    name: "mapboxPopup",
    component: () => import("@/views/mapboxPopup/index.vue"),
  },
  {
    path: "/mapboxMarker",
    name: "mapboxMarker",
    component: () => import("@/views/mapboxMarker/index.vue"),
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
    path: "/cesiumWindy",
    name: "cesiumWindy",
    component: () => import("@/views/cesiumWindy/index.vue"),
  },
  {
    path: "/cesiumCluster",
    name: "cesiumCluster",
    component: () => import("@/views/cesiumCluster/index.vue"),
  },
  {
    path: "/cesiumShader",
    name: "cesiumShader",
    component: () => import("@/views/cesiumShader/index.vue"),
  },
  {
    path: "/cesiumFlyModel",
    name: "cesiumFlyModel",
    component: () => import("@/views/cesiumFlyModel/index.vue"),
  },
  {
    path: "/cesiumHeightFog",
    name: "cesiumHeightFog",
    component: () => import("@/views/cesiumHeightFog/index.vue"),
  },
  {
    path: "/cesiumGeneral",
    name: "cesiumGeneral",
    component: () => import("@/views/cesiumGeneral/index.vue"),
  },
  {
    path: "/cesiumGeoserver",
    name: "cesiumGeoserver",
    component: () => import("@/views/cesiumGeoserver/index.vue"),
  },
  {
    path: "/cesiumThree",
    name: "cesiumThree",
    component: () => import("@/views/cesiumThree/index.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export { router };
