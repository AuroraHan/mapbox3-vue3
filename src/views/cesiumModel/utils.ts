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
