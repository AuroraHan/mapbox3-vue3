import * as Cesium from "cesium";

/**
 * 根据屏幕坐标获取经纬度
 * @param scene
 * @param position
 * @param noPickEntity
 */
export const getCurrentPositionByMouse = (
  scene: Cesium.Scene,
  position: Cesium.Cartesian2,
  noPickEntity: Cesium.Entity | null
) => {
  let cartesian;

  //在模型上提取坐标
  let pickedObject = scene.pick(position);

  //pickPositionSupported :判断是否支持深度拾取,不支持时无法进行鼠标交互绘制
  if (scene.pickPositionSupported && Cesium.defined(pickedObject)) {
    var entity = pickedObject.id;
    if (noPickEntity == null || (noPickEntity && entity !== noPickEntity)) {
      cartesian = scene.pickPosition(position);
      if (Cesium.defined(cartesian)) {
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var height = cartographic.height; //模型高度
        if (height >= 0) return cartesian;

        //不是entity时，支持3dtiles地下
        if (!Cesium.defined(pickedObject.id) && height >= -500)
          return cartesian;
      }
    }
  }

  //测试scene.pickPosition和globe.pick的适用场景 https://zhuanlan.zhihu.com/p/44767866
  //1. globe.pick的结果相对稳定准确，不论地形深度检测开启与否，不论加载的是默认地形还是别的地形数据；
  //2. scene.pickPosition只有在开启地形深度检测，且不使用默认地形时是准确的。
  //注意点： 1. globe.pick只能求交地形； 2. scene.pickPosition不仅可以求交地形，还可以求交除地形以外其他所有写深度的物体。

  //提取鼠标点的地理坐标
  if (scene.mode === Cesium.SceneMode.SCENE3D) {
    //三维模式下
    let pickRay = scene.camera.getPickRay(position);
    cartesian = scene.globe.pick(pickRay!, scene);
  } else {
    //二维模式下
    cartesian = scene.camera.pickEllipsoid(position, scene.globe.ellipsoid);
  }
  return cartesian;
};

/**
 * 进入动画旋转地球
 * @param cesiumV cesium实例
 */
export const rotateGlobe = (cesiumV: Cesium.Viewer) => {
  //如果不是3D球则不能旋转
  if (cesiumV.scene.mode !== Cesium.SceneMode.SCENE3D) return;

  let isRotating = true;
  let totalRotation = 0;
  const rotationSpeed = Cesium.Math.toRadians(4);

  const progressCb = (remaining) => {
    if (remaining === 0) {
      // 地球加载完成
      const callback = () => {
        if (!isRotating) {
          cesiumV.scene.postRender.removeEventListener(callback);
          cesiumV.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(110.39, 39.9, 8000000), // 保持当前位置
            duration: 3, // 动画时长（秒）
          });
          return;
        }
        totalRotation += rotationSpeed;
        cesiumV.scene.camera.rotateRight(rotationSpeed);

        // 检查是否完成一周（2π ≈ 6.283弧度）
        if (totalRotation >= Cesium.Math.TWO_PI) {
          isRotating = false;
        }
      };
      cesiumV.scene.postRender.addEventListener(callback);
      cesiumV.scene.globe.tileLoadProgressEvent.removeEventListener(progressCb);
    }
  };

  // 加载完地球后执行动画
  cesiumV.scene.globe.tileLoadProgressEvent.addEventListener(progressCb);
};

//定义唯一值
export const uuid = () => {
  const id = URL.createObjectURL(new Blob());

  URL.revokeObjectURL(id);
  return id.substring(5 + location.origin.length + 1);
};

/**
 * 屏幕坐标转经纬度坐标
 * @param cViewer
 * @param position
 * @returns
 */
export const postionTransfrom = (
  cViewer: Cesium.Viewer,
  position: Cesium.Cartesian2
) => {
  const ray = cViewer.camera.getPickRay(position);
  const cartesian = cViewer.scene.globe.pick(ray!, cViewer.scene);
  var cartographic = Cesium.Cartographic.fromCartesian(cartesian!);
  const latitude = Number(
    Cesium.Math.toDegrees(cartographic.latitude).toFixed(3)
  );
  const longitude = Number(
    Cesium.Math.toDegrees(cartographic.longitude).toFixed(3)
  );

  return [longitude, latitude];
};
