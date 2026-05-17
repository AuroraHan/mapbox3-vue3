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

  - 通过数据源集合的方式来管理不同类别的实体

  ```typescript
  //创建数据源管理
  const modelCollection = new Cesium.CustomDataSource("modelCollection");
  //向数据源中添加实体
  const modelEntity = modelCollection.entities.add({
    name: "Cesium Air",
    position: Cesium.Cartesian3.fromDegrees(120, 30, 0),
    model: {
      uri: "/models/Cesium_Air.glb",
      minimumPixelSize: 128,
      maximumScale: 20000,
    },
  });

  //将数据源集合添加到场景中
  cesiumV.dataSources.add(modelCollection);
  //控制显示或隐藏
  const controlCollection = () => {
    modelCollection.show = !modelCollection.show; // 切换显示/隐藏
    // modelCollection.entities.removeAll(); // 移除所有实体
  };
  ```
