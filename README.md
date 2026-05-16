# Vue 3 + Vite + Mapbox 3.5.0

### 项目描述

使用 mapbox、Cesium 三维框架结合 vue3 进行搭建

devDependencies -D

http://support.supermap.com.cn:8090/webgl/data/LandTemperature/2016.3.jpg

https://www.shadertoy.com/view/lcKGRc

### 代码整理

- 基础代码

- 中级代码
  - 鼠标获取屏幕经纬度

  ```typescript
  export const getCurrentPositionByMouseNew = (
    viewer: Cesium.Viewer,
    position: Cesium.Cartesian2,
  ) => {
    let pos;
    let scene = viewer.scene;
    //在模型上提取坐标
    let pickedObject = scene.pick(position);

    //pickPositionSupported :判断是否支持深度拾取
    if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
      let cartesian = scene.pickPosition(position);
      if (Cesium.defined(cartesian)) {
        pos = transformRadianToDegree(cartesian);
        return pos;
      }
    }

    let cartesian;
    //提取鼠标点的地理坐标
    if (scene.mode === Cesium.SceneMode.SCENE3D) {
      //三维模式下
      let pickRay = scene.camera.getPickRay(position);
      cartesian = scene.globe.pick(pickRay!, scene);
    } else {
      //二维模式下
      cartesian = scene.camera.pickEllipsoid(position, scene.globe.ellipsoid);
    }

    pos = transformRadianToDegree(cartesian!);

    return pos;
  };
  ```
