import * as Cesium from "cesium";

/**
 * 控制模型旋转
 */
export class ModelRotateController {
  viewer: Cesium.Viewer;
  handler: Cesium.ScreenSpaceEventHandler;

  private originalColor: Cesium.Color | undefined;

  selectedEntity: Cesium.Entity | null = null;

  private startMouseX = 0;
  private startHeading = 0;
  private rotating = false;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

    this.initEvents();
  }

  initEvents() {
    // 鼠标按下
    this.handler.setInputAction((movement: any) => {
      const picked = this.viewer.scene.pick(movement.position);

      if (!picked || !picked.id) return;

      const entity = picked.id;

      if (!(entity instanceof Cesium.Entity)) return;

      this.selectedEntity = entity;

      this.rotating = true;

      this.startMouseX = movement.position.x;

      const time = Cesium.JulianDate.now();

      let heading = 0;

      if (entity.orientation) {
        const q = entity.orientation.getValue(time);

        const hpr = Cesium.HeadingPitchRoll.fromQuaternion(q);

        heading = hpr.heading;
      }

      this.startHeading = heading;

      // 保存原始颜色
      this.originalColor =
        entity.model!.color?.getValue?.() || Cesium.Color.WHITE;

      // 设置高亮
      entity!.model.color = Cesium.Color.YELLOW.withAlpha(0.6);
      entity!.model.colorBlendMode = Cesium.ColorBlendMode.MIX;
      entity!.model.colorBlendAmount = 0.8;

      // 禁止相机旋转
      this.viewer.scene.screenSpaceCameraController.enableRotate = false;
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 鼠标移动
    this.handler.setInputAction((movement: any) => {
      if (!this.rotating || !this.selectedEntity) return;

      const deltaX = movement.endPosition.x - this.startMouseX;

      const heading = this.startHeading + deltaX * 0.01;

      const entity = this.selectedEntity;

      const time = Cesium.JulianDate.now();

      const position = entity.position?.getValue(time);

      const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);

      entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
        position,
        hpr,
      );
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 鼠标释放
    this.handler.setInputAction(() => {
      if (this.selectedEntity && this.selectedEntity.model) {
        this.selectedEntity.model.color =
          this.originalColor || Cesium.Color.WHITE;

        this.selectedEntity.model.colorBlendAmount = 0;
      }

      this.rotating = false;

      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
  }

  /**
   * 注册模型
   */
  add(entity: Cesium.Entity) {
    // 只是标记，点击时自动识别
    entity["enableRotate"] = true;
  }

  /**
   * 销毁
   */
  destroy() {
    this.handler.destroy();
    this.handler = null;

    if (this.viewer) {
      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
    }

    this.selectedEntity = null;
    this.rotating = false;
  }
}

/**
 * 点击模型A → 可旋转
点击模型B → 销毁A控制器 → 创建B控制器
 * 
 * selectModel(entity){

  if(this.rotateController){
     this.rotateController.destroy()
  }

  this.rotateController = new ModelRotateController(viewer)

  this.rotateController.add(entity)

}
 * 
 * 
 * 
 * 
 */
