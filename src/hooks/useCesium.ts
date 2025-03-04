import { onMounted, onUnmounted } from "vue";
import * as Cesium from "cesium";

interface options {
  container: string | HTMLElement;
  infoBox?: boolean;
  timeline?: boolean;
  animation?: boolean;
}

export function useCesium(options: options) {
  let cesiumV: Cesium.Viewer;

  //初始化
  const initCesium = async () => {
    Cesium.Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYTQ2ZjdjNS1jM2E0LTQ1M2EtOWM0My1mODMzNzY3YjYzY2YiLCJpZCI6MjkzMjcsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1OTE5NDIzNjB9.RzKlVTVDTQ9r7cqCo-PDydgUh8Frgw0Erul_BVxiS9c";

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
    });

    // const customTilingScheme = new Cesium.WebMercatorTilingScheme({
    //   numberOfLevelZeroTilesX: 1,
    //   numberOfLevelZeroTilesY: 1,
    // });

    // const provider = await Cesium.TileMapServiceImageryProvider.fromUrl(
    //   "/tile",
    //   {
    //     fileExtension: "jpg",
    //     tilingScheme: customTilingScheme,
    //     rectangle: Cesium.Rectangle.fromDegrees(-180, -85.06, 180, 85.06),
    //   }
    // );

    // cesiumV.imageryLayers.addImageryProvider(provider);

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
