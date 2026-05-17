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
 * 可视域分析类
 * 用于分析地形/建筑的可视范围
 */
export class ViewAreaAnalysis {
  private viewer: Cesium.Viewer;
  private handler: Cesium.ScreenSpaceEventHandler;

  // 内部状态
  private frustrumLabel: Cesium.Entity | undefined;
  private viewPointFlag: boolean = false;
  private pickPositions: Cesium.Cartesian3[] = [];
  private boardLines: Cesium.Entity[] = [];
  private pickPoints: Cesium.Entity[] = [];
  private activeLine: Cesium.Entity | undefined;

  /**
   * @param viewer - Cesium Viewer 实例
   * @param handler - 事件处理器实例
   */
  constructor(viewer: Cesium.Viewer, handler: Cesium.ScreenSpaceEventHandler) {
    this.viewer = viewer;
    this.handler = handler;
  }

  /**
   * 创建点实体
   * @param position - 点的位置
   * @param color - 点的颜色
   * @returns 点实体
   */
  private createPoint(
    position: Cesium.Cartesian3,
    color: Cesium.Color = Cesium.Color.WHITE,
  ): Cesium.Entity {
    return this.viewer.entities.add({
      position: position,
      point: {
        pixelSize: 10,
        color: color,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
  }

  /**
   * 创建标签实体
   * @param position - 标签位置
   * @param text - 标签文本
   * @returns 标签实体
   */
  private createLabel(
    position: Cesium.Cartesian3,
    text: string,
  ): Cesium.Entity {
    return this.viewer.entities.add({
      position: position,
      label: {
        text: text,
        font: "16px sans-serif",
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
  }

  /**
   * 计算两点之间的直线距离
   * @param point1 - 第一个点
   * @param point2 - 第二个点
   * @returns 两点之间的距离（米）
   */
  private distanceBetweenTwoPoints(
    point1: Cesium.Cartesian3,
    point2: Cesium.Cartesian3,
  ): number {
    return Cesium.Cartesian3.distance(point1, point2);
  }

  /**
   * 绘制线
   * @param positionData - 线的位置数据
   * @param material - 线的材质
   * @param depthFailMaterial - 被地形遮挡部分的材质
   * @returns 线实体
   */
  private drawLine(
    positionData: Cesium.Cartesian3[] | Cesium.CallbackProperty,
    material: Cesium.MaterialProperty | Cesium.Color,
    depthFailMaterial: Cesium.MaterialProperty | Cesium.Color,
  ): Cesium.Entity {
    return this.viewer.entities.add({
      polyline: {
        positions: positionData,
        arcType: Cesium.ArcType.NONE,
        width: 5,
        material: material,
        depthFailMaterial: depthFailMaterial,
      },
    });
  }

  /**
   * 计算某点绕另一点旋转radian后的终点坐标
   * @param radian - 旋转弧度
   * @param startPoint - 旋转中心点
   * @param endPoint - 待旋转的点
   * @returns 旋转后的坐标
   */
  private rotatePoint(
    radian: number,
    startPoint: Cesium.Cartesian3,
    endPoint: Cesium.Cartesian3,
  ): Cesium.Cartesian3 {
    const startCartographic = Cesium.Cartographic.fromCartesian(startPoint)!;
    const endCartographic = Cesium.Cartographic.fromCartesian(endPoint)!;

    const webMercatorProjection = new Cesium.WebMercatorProjection(
      this.viewer.scene.globe.ellipsoid,
    );
    const startMercator = webMercatorProjection.project(startCartographic);
    const endMercator = webMercatorProjection.project(endCartographic);

    const position_Mercator = new Cesium.Cartesian3(
      (endMercator.x - startMercator.x) * Math.cos(radian) -
        (endMercator.y - startMercator.y) * Math.sin(radian) +
        startMercator.x,
      (endMercator.x - startMercator.x) * Math.sin(radian) +
        (endMercator.y - startMercator.y) * Math.cos(radian) +
        startMercator.y,
      startMercator.z,
    );

    const position_Cartographic =
      webMercatorProjection.unproject(position_Mercator);
    return Cesium.Cartographic.toCartesian(position_Cartographic.clone())!;
  }

  /**
   * 画线段绕起点旋转后的线
   * @param radian - 旋转弧度
   * @param startPoint - 起点
   * @param endPoint - 终点
   * @returns 旋转后的线实体
   */
  private rotateLine(
    radian: number,
    startPoint: Cesium.Cartesian3,
    endPoint: Cesium.Cartesian3,
  ): Cesium.Entity {
    const position_Cartesian3 = this.rotatePoint(radian, startPoint, endPoint);
    return this.drawLine(
      [startPoint, position_Cartesian3],
      new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.YELLOW }),
      Cesium.Color.YELLOW,
    );
  }

  /**
   * 绘制扇形可视区域的两条边界线
   * @param startPoint - 视点
   * @param endPoint - 方向点
   * @returns 边界线实体数组
   */
  private drawSector(
    startPoint: Cesium.Cartesian3,
    endPoint: Cesium.Cartesian3,
  ): Cesium.Entity[] {
    return [
      this.rotateLine(Cesium.Math.toRadians(45), startPoint, endPoint),
      this.rotateLine(Cesium.Math.toRadians(-45), startPoint, endPoint),
    ];
  }

  /**
   * 计算两点连线与地形/建筑的交点，并绘制可视线
   * @param startPoint - 起点
   * @param endPoint - 终点
   */
  private getIntersectPoint(
    startPoint: Cesium.Cartesian3,
    endPoint: Cesium.Cartesian3,
  ): void {
    const direction = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(endPoint, startPoint, new Cesium.Cartesian3()),
      new Cesium.Cartesian3(),
    );

    const ray = new Cesium.Ray(startPoint, direction);
    const result = this.viewer.scene.pickFromRay(ray);

    if (Cesium.defined(result) && result?.position) {
      const intersectPosition = result.position;
      if (
        this.distanceBetweenTwoPoints(startPoint, endPoint) >
        this.distanceBetweenTwoPoints(intersectPosition, startPoint)
      ) {
        this.drawLine(
          [startPoint, intersectPosition],
          Cesium.Color.GREEN,
          Cesium.Color.GREEN,
        );
        this.drawLine(
          [intersectPosition, endPoint],
          Cesium.Color.RED,
          Cesium.Color.RED,
        );
      } else {
        this.drawLine(
          [startPoint, endPoint],
          Cesium.Color.GREEN,
          Cesium.Color.GREEN,
        );
      }
    } else {
      this.drawLine(
        [startPoint, endPoint],
        Cesium.Color.GREEN,
        Cesium.Color.GREEN,
      );
    }
  }

  /**
   * 执行可视域分析
   * @param degree - 分析角度范围（度）
   * @param startPoint - 视点
   * @param endPoint - 方向点
   */
  private analyze(
    degree: number,
    startPoint: Cesium.Cartesian3,
    endPoint: Cesium.Cartesian3,
  ): void {
    for (let i = -degree; i <= degree; ++i) {
      const radian = Cesium.Math.toRadians(i);
      const destPoint = this.rotatePoint(radian, startPoint, endPoint);
      this.getIntersectPoint(startPoint, destPoint);
    }

    // 清理临时实体
    if (this.frustrumLabel) {
      this.viewer.entities.remove(this.frustrumLabel);
      this.frustrumLabel = undefined;
    }
    if (this.activeLine) {
      this.viewer.entities.remove(this.activeLine);
      this.activeLine = undefined;
    }
    this.pickPositions = [];

    for (const point of this.pickPoints) {
      this.viewer.entities.remove(point);
    }
    this.pickPoints = [];
  }

  /**
   * 设置鼠标事件处理器
   * @param flag - true 启用，false 禁用
   */
  private setBuildFrustrumHandler(flag: boolean): void {
    if (flag) {
      // 左键点击事件
      this.handler?.setInputAction(
        (event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
          const earthPosition = this.viewer.scene.pickPosition(event.position);
          if (Cesium.defined(earthPosition)) {
            this.pickPoints.push(this.createPoint(earthPosition));
            this.pickPositions.push(earthPosition);

            if (this.pickPositions.length > 1) {
              // 清除边界线
              for (const line of this.boardLines) {
                this.viewer.entities.remove(line);
              }
              if (this.frustrumLabel?.label) {
                this.frustrumLabel.label.text = "可视域分析中...";
              }
              this.setBuildFrustrumHandler(false);
              this.analyze(45, this.pickPositions[0], this.pickPositions[1]);
              return;
            }

            this.viewPointFlag = true;
            const dynamicPositions = new Cesium.CallbackProperty(
              () => this.pickPositions,
              false,
            );
            this.activeLine = this.drawLine(
              dynamicPositions,
              Cesium.Color.WHITE,
              Cesium.Color.WHITE,
            );
          }
        },
        Cesium.ScreenSpaceEventType.LEFT_CLICK,
      );

      // 鼠标移动事件
      this.handler.setInputAction(
        (event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
          const newPosition = this.viewer.scene.pickPosition(event.endPosition);
          if (Cesium.defined(newPosition)) {
            if (!this.frustrumLabel) {
              this.frustrumLabel = this.createLabel(
                newPosition,
                "点击选择视点",
              );
            } else {
              this.frustrumLabel.position =
                newPosition as Cesium.PositionProperty;
              if (this.viewPointFlag && this.frustrumLabel.label) {
                this.frustrumLabel.label.text = "点击视线方向";
                if (this.pickPositions.length > 1) {
                  this.pickPositions.pop();
                }
                this.pickPositions.push(newPosition);

                // 清除旧边界线
                if (this.boardLines.length > 1) {
                  for (const line of this.boardLines) {
                    this.viewer.entities.remove(line);
                  }
                }

                // 构建可视区域
                if (this.pickPositions.length > 1) {
                  this.boardLines = this.drawSector(
                    this.pickPositions[0],
                    this.pickPositions[1],
                  );
                }
              }
            }
          }
        },
        Cesium.ScreenSpaceEventType.MOUSE_MOVE,
      );
    } else {
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
  }

  /**
   * 启动可视域分析
   */
  start(): void {
    this.viewer.entities.removeAll();
    this.pickPositions = [];
    this.boardLines = [];
    this.pickPoints = [];
    this.frustrumLabel = undefined;
    this.viewPointFlag = false;
    this.activeLine = undefined;
    this.setBuildFrustrumHandler(true);
  }

  /**
   * 停止分析并清理资源
   */
  destroy(): void {
    this.setBuildFrustrumHandler(false);
    this.viewer.entities.removeAll();
    this.pickPositions = [];
    this.boardLines = [];
    this.pickPoints = [];
    this.frustrumLabel = undefined;
    this.viewPointFlag = false;
    this.activeLine = undefined;
  }
}
