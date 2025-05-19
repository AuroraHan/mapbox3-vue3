import { onMounted, onUnmounted } from "vue";
import * as Cesium from "cesium";

interface options {
  container: string | HTMLElement;
  infoBox?: boolean;
  timeline?: boolean;
  animation?: boolean;
  addTerrain?: boolean;
  shouldAnimate?: boolean;
}

export function useCesium(options: options) {
  let cesiumV: Cesium.Viewer;

  //初始化
  const initCesium = async () => {
    Cesium.Ion.defaultAccessToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4YzI5OGVlNy1jOWY2LTRjNmEtYWYzMC1iNzhkZDhkZmEwOWEiLCJpZCI6MTM2MCwiaWF0IjoxNTI4MTQ0MDMyfQ.itVtUPeeXb7dasKXTUYZ6r3Hbm7OVUoA26ahLaVyj5I';

    //设置默认观察位置
    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
      89.5,
      20.4,
      110.4,
      61.2
    );
    cesiumV = new Cesium.Viewer(options.container, {
      infoBox: options.infoBox,
      geocoder: false, //地址查询
      navigationHelpButton: false, //是否现在帮助按钮
      timeline: options.timeline,
      animation: options.animation,
      shouldAnimate: options.shouldAnimate,
    });

    //添加地形
    if (options.addTerrain) {
      const provider = await Cesium.createWorldTerrainAsync({
        requestVertexNormals: true,
        requestWaterMask: true,
      });
      cesiumV.terrainProvider = provider;
    }

    // 使用mapbox的底图 加载xyz
    // var xyz = new Cesium.UrlTemplateImageryProvider({
    //   credit: "mapbox",
    //   url: "/tile/{z}/{x}/{y}.jpg",
    // });
    // cesiumV.imageryLayers.addImageryProvider(xyz);

    //隐藏logo
    //@ts-ignore
    cesiumV.cesiumWidget.creditContainer.style.display = "none";
    //开启帧率
    cesiumV.scene.debugShowFramesPerSecond = true;
  };

  //获取Viewer
  const getCesiumViewer = () => {
    return cesiumV;
  };

  onMounted(() => {
    initCesium();
  });

  onUnmounted(() => {
    cesiumV.destroy();
  });

  return {
    getCesiumViewer,
  };
}
