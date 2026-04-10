import * as Cesium from "cesium";
/**
 * 封装一个GLB动画类，包含加载模型、播放动画和暂停动画的方法
 */
class GLBAnimation {
  viewer: Cesium.Viewer;
  url: string;
  position: Cesium.Cartesian3;
  model: Cesium.Model | null;
  constructor(viewer: Cesium.Viewer, url: string, position: Cesium.Cartesian3) {
    this.viewer = viewer;
    this.url = url;
    this.position = position;
    this.model = null;
  }

  async load() {
    this.model = await Cesium.Model.fromGltfAsync({
      url: this.url,
      modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(this.position),
    });

    this.viewer.scene.primitives.add(this.model);
  }

  play() {
    this.model?.activeAnimations.addAll({
      loop: Cesium.ModelAnimationLoop.REPEAT,
    });
  }

  pause() {
    this.model?.activeAnimations.removeAll();
  }
}

export class ModelRotator {
  viewer: Cesium.Viewer;
  model: any;
  handler: null;
  isSelected: boolean;
  isRotating: boolean;
  heading: number;
  pitch: number;
  roll: number;
  position: Cesium.Cartesian3;
  onChange: any;
  constructor(viewer: Cesium.Viewer, model: any) {
    this.viewer = viewer;
    this.model = model;

    this.handler = null;
    this.isSelected = false;
    this.isRotating = false;

    // 当前角度（弧度）
    this.heading = 0;
    this.pitch = 0;
    this.roll = 0;

    this.position = Cesium.Matrix4.getTranslation(
      model.modelMatrix,
      new Cesium.Cartesian3(),
    );

    this.init();
  }

  init() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // 点击选中模型
    this.handler.setInputAction((click) => {
      const picked = this.viewer.scene.pick(click.position);

      if (picked && picked.primitive === this.model) {
        this.isSelected = true;
        this.highlight(true);
      } else {
        this.isSelected = false;
        this.highlight(false);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标按下开始旋转
    this.handler.setInputAction(() => {
      if (this.isSelected) {
        this.isRotating = true;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 鼠标抬起结束旋转
    this.handler.setInputAction(() => {
      this.isRotating = false;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // 鼠标移动控制旋转
    this.handler.setInputAction((movement) => {
      if (!this.isRotating) return;

      const deltaX = movement.endPosition.x - movement.startPosition.x;
      const deltaY = movement.endPosition.y - movement.startPosition.y;

      // 控制旋转灵敏度
      this.heading += deltaX * 0.005;
      this.pitch += deltaY * 0.005;

      this.updateModelMatrix();

      this.onChange && this.onChange(this.getDegrees());
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  // 更新矩阵
  updateModelMatrix() {
    const hpr = new Cesium.HeadingPitchRoll(
      this.heading,
      this.pitch,
      this.roll,
    );

    this.model.modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
      this.position,
      hpr,
    );
  }

  // 高亮
  highlight(flag) {
    this.model.color = flag
      ? Cesium.Color.YELLOW.withAlpha(0.8)
      : Cesium.Color.WHITE;
  }

  // 获取角度（角度制）
  getDegrees() {
    return {
      heading: Cesium.Math.toDegrees(this.heading),
      pitch: Cesium.Math.toDegrees(this.pitch),
      roll: Cesium.Math.toDegrees(this.roll),
    };
  }

  // 外部监听
  onRotate(callback) {
    this.onChange = callback;
  }

  // 销毁
  destroy() {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
  }
}

export class ModelZRotator {
  viewer: Cesium.Viewer;
  model: any;
  handler: null;
  isSelected: boolean;
  isRotating: boolean;
  heading: number;
  position: Cesium.Cartesian3;
  onChange: any;
  constructor(viewer: Cesium.Viewer, model: any) {
    this.viewer = viewer;
    this.model = model;

    this.handler = null;
    this.isSelected = false;
    this.isRotating = false;

    // 只保留 heading
    this.heading = 0;

    this.position = Cesium.Matrix4.getTranslation(
      model.modelMatrix,
      new Cesium.Cartesian3(),
    );

    this.init();
  }

  init() {
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    // 点击选中
    this.handler.setInputAction((click) => {
      const picked = this.viewer.scene.pick(click.position);

      if (picked && picked.primitive === this.model) {
        this.isSelected = true;
        this.highlight(true);
      } else {
        this.isSelected = false;
        this.highlight(false);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标按下
    this.handler.setInputAction(() => {
      if (this.isSelected) this.isRotating = true;
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 鼠标抬起
    this.handler.setInputAction(() => {
      this.isRotating = false;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // 鼠标移动 → 只控制 heading
    this.handler.setInputAction((movement) => {
      if (!this.isRotating) return;

      const deltaX = movement.endPosition.x - movement.startPosition.x;

      // 控制旋转速度
      this.heading += deltaX * 0.005;

      this.updateModelMatrix();

      this.onChange && this.onChange(this.getDegrees());
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  updateModelMatrix() {
    const hpr = new Cesium.HeadingPitchRoll(
      this.heading,
      0, // 锁死
      0, // 锁死
    );

    this.model.modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
      this.position,
      hpr,
    );
  }

  highlight(flag) {
    this.model.color = flag
      ? Cesium.Color.YELLOW.withAlpha(0.8)
      : Cesium.Color.WHITE;
  }

  // 输出 0~360°
  getDegrees() {
    let deg = Cesium.Math.toDegrees(this.heading) % 360;
    if (deg < 0) deg += 360;

    return {
      heading: deg,
    };
  }

  onRotate(cb) {
    this.onChange = cb;
  }

  destroy() {
    this.handler?.destroy();
    this.handler = null;
  }
}

class UnitEntityManager {
  viewer: Cesium.Viewer;
  entityMap: Map<string, any>;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.entityMap = new Map();
    // UI统一刷新（只注册一次）
    this.viewer.scene.postRender.addEventListener(this.updateUI.bind(this));
  }

  updateFromServer(list: Array<any>) {
    const now = Cesium.JulianDate.now();
    // const aliveIds = new Set();

    list.forEach((data) => {
      // aliveIds.add(data.id);

      if (this.entityMap.has(data.id)) {
        this.updateUnit(data, now);
      } else {
        this.createUnit(data, now);
      }
    });

    // 删除
    // this.map.forEach((_, id) => {
    //     if (!aliveIds.has(id)) {
    //         this.remove(id);
    //     }
    // });
  }

  createUnit(data: any, time: any) {
    const position = Cesium.Cartesian3.fromDegrees(
      data.lon,
      data.lat,
      data.height || 0,
    );

    const entity = this.viewer.entities.add({
      id: data.id,
      position: new Cesium.SampledPositionProperty(),
      // ✅ 默认2D图标
      billboard: {
        image: data.iconUrl,
        scale: 1,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      },
      properties: {
        ...data,
      },

      // ❗先不加载模型（性能关键）
      // model: undefined
    });

    entity.position.addSample(time, position);

    const el = createHealthBar();
    this.setHP(el, data.hp);

    this.entityMap.set(data.id, {
      entity,
      el,
    });
  }

  updateUnit(data: any, time: any) {
    const item = this.entityMap.get(data.id);

    const newPos = Cesium.Cartesian3.fromDegrees(
      data.lon,
      data.lat,
      data.height || 0,
    );

    // 🚀 平滑移动（关键）
    item.entity.position.addSample(time, newPos);

    // 控制缓存长度（防止爆内存）
    if (item.entity.position._property._times.length > 10) {
      item.entity.position._property._times.shift();
      item.entity.position._property._values.shift();
    }

    // 更新血条
    this.setHP(item.el, data.hp);
  }

  // switchAllTo3D() {
  //     if (this.globalMode === '3D') return;

  //     this.globalMode = '3D';

  //     this.map.forEach(item => {
  //         const entity = item.entity;
  //         const data = item.data;

  //         // ❌ 关闭2D
  //         entity.billboard = undefined;

  //         // ✅ 开启3D（懒加载）
  //         entity.model = {
  //             uri: data.modelUrl,
  //             scale: 1,
  //             minimumPixelSize: 32
  //         };
  //     });
  // }

  setHP(el: HTMLElement, percent: number) {
    const inner = el.querySelector(".hp-inner");
    inner!.style.width = percent + "%";

    if (percent > 60) inner.style.background = "green";
    else if (percent > 30) inner.style.background = "orange";
    else inner.style.background = "red";
  }

  updateUI() {
    this.entityMap.forEach((item) => {
      const entity = item.entity;
      const el = item.el;

      const position = entity.position.getValue(this.viewer.clock.currentTime);

      if (!position) return;

      const canvasPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
        this.viewer.scene,
        position,
      );

      if (canvasPosition) {
        el.style.left = canvasPosition.x - 30 + "px";
        el.style.top = canvasPosition.y - 60 + "px";

        // 🚀 距离缩放
        const distance = Cesium.Cartesian3.distance(
          this.viewer.camera.position,
          position,
        );

        const scale = Math.max(0.5, 1 - distance / 5000000);
        el.style.transform = `scale(${scale})`;

        el.style.display = "block";
      } else {
        el.style.display = "none";
      }
    });
  }
}
