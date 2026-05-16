import * as Cesium from "cesium";

/**
 * 最新根据屏幕坐标获取经纬度
 */
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

//弧度转成角度
const transformRadianToDegree = (cartesian: Cesium.Cartesian3) => {
  let { latitude, longitude, height } =
    Cesium.Cartographic.fromCartesian(cartesian);
  const lat = Number(Cesium.Math.toDegrees(latitude).toFixed(6));
  const lon = Number(Cesium.Math.toDegrees(longitude).toFixed(6));

  return {
    longitude: lon,
    latitude: lat,
    height,
  };
};

/**
 * 根据屏幕坐标获取经纬度
 * @param scene
 * @param position
 * @param noPickEntity
 */
export const getCurrentPositionByMouse = (
  scene: Cesium.Scene,
  position: Cesium.Cartesian2,
  noPickEntity: Cesium.Entity | null,
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
  position: Cesium.Cartesian2,
) => {
  const ray = cViewer.camera.getPickRay(position);
  const cartesian = cViewer.scene.globe.pick(ray!, cViewer.scene);
  var cartographic = Cesium.Cartographic.fromCartesian(cartesian!);
  const latitude = Number(
    Cesium.Math.toDegrees(cartographic.latitude).toFixed(3),
  );
  const longitude = Number(
    Cesium.Math.toDegrees(cartographic.longitude).toFixed(3),
  );

  return [longitude, latitude];
};

// 工具类函数如下：
export function debounce(func: Function, delay: number) {
  let timeoutId: number;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
/**
 * 获取当前的图层层级
 * @param {cesium.viewer} viewer
 * @returns 图层层级
 */
export const getTileLevel = (viewer: Cesium.Viewer) => {
  let tiles = new Set();
  let tilesToRender = viewer.scene.globe._surface._tilesToRender;
  if (Cesium.defined(tilesToRender)) {
    for (let i = 0; i < tilesToRender.length; i++) {
      tiles.add(tilesToRender[i].level);
    }
    const levels = Array.from(tiles);
    return Math.max(...levels);
  }
};
/**
 * 获取3D模式下cesium的屏幕经纬度
 * @param {cesium.viewer} viewer
 * @returns 经纬度信息
 */
export const getViewBounds = (viewer: Cesium.Viewer) => {
  let bounds = {
    topLeft: { lon: 0, lat: 0 },
    bottomRight: { lon: 0, lat: 0 },
    level: 0,
  };

  // 获取当前视图矩形范围
  const extent = viewer.camera.computeViewRectangle();

  // 在3D模式下计算边界
  if (extent) {
    bounds.topLeft.lon = Cesium.Math.toDegrees(extent.west);
    bounds.topLeft.lat = Cesium.Math.toDegrees(extent.north);
    bounds.bottomRight.lon = Cesium.Math.toDegrees(extent.east);
    bounds.bottomRight.lat = Cesium.Math.toDegrees(extent.south);
  }
  bounds.level = getTileLevel(viewer);
  return bounds;
};

/**
 * 视域分析类
 * 1. 点击选择视点和视线方向
 * 2. 绘制可视域范围
 * 3. 支持动态调整视线方向
 * 4. 支持清除分析结果
 */
export class ViewShedAnalysis {
  viewer: Cesium.Viewer;
  handler: Cesium.ScreenSpaceEventHandler;
  frustrumLabel: undefined;
  viewPointFlag: boolean;
  pickPositions: any;
  pickPoints: any;
  boardLines: any;
  activeLine: null;
  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

    this.frustrumLabel = undefined;
    this.viewPointFlag = false;

    this.pickPositions = [];
    this.pickPoints = [];
    this.boardLines = [];

    this.activeLine = null;
  }

  /** ===================== 对外方法 ===================== */

  start() {
    this._clear();
    this._bindEvents();
  }

  destroy() {
    this._unbindEvents();
    this._clear();
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
  }

  /** ===================== 事件绑定 ===================== */

  _bindEvents() {
    // 左键点击
    this.handler.setInputAction((event) => {
      const earthPosition = this.viewer.scene.pickPosition(event.position);

      if (Cesium.defined(earthPosition)) {
        this.pickPoints.push(this._createPoint(earthPosition));

        this.pickPositions.push(earthPosition);

        if (this.pickPositions.length === 1) {
          this.viewPointFlag = true;
        }

        if (this.pickPositions.length > 1) {
          this._clearBoardLines();

          this.frustrumLabel.label.text = "可视域分析中...";
          this._unbindEvents();

          this._viewAreaAnalysis(
            45,
            this.pickPositions[0],
            this.pickPositions[1],
          );
          return;
        }

        const dynamicPositions = new Cesium.CallbackProperty(() => {
          return this.pickPositions;
        }, false);

        this.activeLine = this._drawLine(
          dynamicPositions,
          Cesium.Color.WHITE,
          Cesium.Color.WHITE,
        );
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动
    this.handler.setInputAction((event) => {
      const newPosition = this.viewer.scene.pickPosition(event.endPosition);

      if (!Cesium.defined(newPosition)) return;

      if (!this.frustrumLabel) {
        this.frustrumLabel = this._createLabel(newPosition, "点击选择视点");
        return;
      }

      this.frustrumLabel.position = newPosition;

      if (this.viewPointFlag) {
        this.frustrumLabel.label.text = "点击视线方向";

        this.pickPositions.pop();
        this.pickPositions.push(newPosition);

        this._clearBoardLines();

        if (this.pickPositions.length > 1) {
          this.boardLines = this._drawSector(
            this.pickPositions[0],
            this.pickPositions[1],
          );
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  _unbindEvents() {
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  /** ===================== 核心分析 ===================== */

  _viewAreaAnalysis(degree, startPoint, endPoint) {
    for (let i = -degree; i <= degree; i++) {
      let radian = Cesium.Math.toRadians(i);
      let destPoint = this._rotatePoint(radian, startPoint, endPoint);
      this._getIntersectPoint(startPoint, destPoint);
    }

    this.viewer.entities.remove(this.frustrumLabel);
    this.viewer.entities.remove(this.activeLine);

    this.pickPositions = [];

    this.pickPoints.forEach((p) => this.viewer.entities.remove(p));
    this.pickPoints = [];
  }

  _getIntersectPoint(startPoint, endPoint) {
    let direction = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(endPoint, startPoint, new Cesium.Cartesian3()),
      new Cesium.Cartesian3(),
    );

    let ray = new Cesium.Ray(startPoint, direction);
    let result = this.viewer.scene.pickFromRay(ray);

    if (Cesium.defined(result)) {
      let intersect = result.position;

      if (
        this._distance(startPoint, endPoint) >
        this._distance(startPoint, intersect)
      ) {
        this._drawLine(
          [startPoint, intersect],
          Cesium.Color.GREEN,
          Cesium.Color.GREEN,
        );
        this._drawLine(
          [intersect, endPoint],
          Cesium.Color.RED,
          Cesium.Color.RED,
        );
      } else {
        this._drawLine(
          [startPoint, endPoint],
          Cesium.Color.GREEN,
          Cesium.Color.GREEN,
        );
      }
    } else {
      this._drawLine(
        [startPoint, endPoint],
        Cesium.Color.GREEN,
        Cesium.Color.GREEN,
      );
    }
  }

  /** ===================== 几何计算 ===================== */

  _drawSector(startPoint, endPoint) {
    let left = this._rotateLine(
      Cesium.Math.toRadians(45),
      startPoint,
      endPoint,
    );
    let right = this._rotateLine(
      Cesium.Math.toRadians(-45),
      startPoint,
      endPoint,
    );
    return [left, right];
  }

  _rotateLine(radian, startPoint, endPoint) {
    let p = this._rotatePoint(radian, startPoint, endPoint);
    return this._drawLine(
      [startPoint, p],
      new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.YELLOW }),
      Cesium.Color.YELLOW,
    );
  }

  _rotatePoint(radian, startPoint, endPoint) {
    let projection = new Cesium.WebMercatorProjection(
      this.viewer.scene.globe.ellipsoid,
    );

    let start = projection.project(
      Cesium.Cartographic.fromCartesian(startPoint),
    );
    let end = projection.project(Cesium.Cartographic.fromCartesian(endPoint));

    let x =
      (end.x - start.x) * Math.cos(radian) -
      (end.y - start.y) * Math.sin(radian) +
      start.x;

    let y =
      (end.x - start.x) * Math.sin(radian) +
      (end.y - start.y) * Math.cos(radian) +
      start.y;

    let result = projection.unproject(new Cesium.Cartesian3(x, y, start.z));
    return Cesium.Cartographic.toCartesian(result);
  }

  _distance(a, b) {
    return Cesium.Cartesian3.distance(a, b);
  }

  /** ===================== 绘制 ===================== */

  _drawLine(positions, material, depthMaterial) {
    return this.viewer.entities.add({
      polyline: {
        positions,
        width: 5,
        arcType: Cesium.ArcType.NONE,
        material,
        depthFailMaterial: depthMaterial,
      },
    });
  }

  _createPoint(position) {
    return this.viewer.entities.add({
      position,
      point: {
        pixelSize: 8,
        color: Cesium.Color.RED,
      },
    });
  }

  _createLabel(position, text) {
    return this.viewer.entities.add({
      position,
      label: {
        text,
        font: "14px sans-serif",
        fillColor: Cesium.Color.WHITE,
        showBackground: true,
      },
    });
  }

  /** ===================== 工具 ===================== */

  _clearBoardLines() {
    this.boardLines.forEach((line) => this.viewer.entities.remove(line));
    this.boardLines = [];
  }

  _clear() {
    this.viewer.entities.removeAll();
    this.pickPositions = [];
    this.pickPoints = [];
    this.boardLines = [];
    this.frustrumLabel = undefined;
    this.viewPointFlag = false;
  }
}

// 在cesium开发中，后端通过websocket发送数据到前端，数据是一个list，里面存放
// 船只的移动数据。我的伪代码如下：
// const entityMap = new Map(); // 存储船只实体的映射
// const updataData = (list) => {
//   for (let i = 0; i < list.length; i++) {
//   const data = list[i];

//   // 解析数据，获取船只的经纬度坐标
//   const longitude = data.longitude;
//   const latitude = data.latitude;
//   const time = data.time;
//   const id = data.id; // 每条数据都有一个唯一的id字段

//   if (entityMap.has(id)) {
//     //已经存在则更新位置和时间
//     const entity = entityMap.get(id);
//     const position = entity.position as Cesium.SampledPositionProperty;
//     position.addSample(Cesium.JulianDate.fromDate(new Date(time)), Cesium.Cartesian3.fromDegrees(longitude, latitude));
//   } else {
//     //不存在实体则创建
//     const position = new Cesium.SampledPositionProperty()
//     position.addSample(Cesium.JulianDate.fromDate(new Date(time)), Cesium.Cartesian3.fromDegrees(longitude, latitude));
//     const entity = viewer.entities.add({
//       id: id,
//       position: position,
//       orientation:new Cesium.VelocityOrientationProperty(position),
//       model: {
//         uri: 'path/to/ship/model.gltf', // 替换为你的船只模型路径
//         minimumPixelSize: 64, // 根据需要调整模型的最小像素大小
//       },
//     });
//     entityMap.set(id, entity);
//   }
// }
// }
// 但是在实际页面中，模型的方向角还是存在问题。模型本身建模没有问题。
