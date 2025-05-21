import Dialog from "/@/utils/cesiumDialog";
import { FeatureCollection } from "geojson";
import * as Cesium from "cesium";
import { randomGeoJsonPoint } from "../tools";
import { ref } from "vue";

export class Cluster {
  viewer: Cesium.Viewer;
  geojson: null | FeatureCollection<GeoJSON.Point>;
  dataSources: null | Cesium.DataSource;
  colorArr = [
    {
      num: 1,
      size: 30,
      color: "#1c86d1cc",
    },
    {
      num: 50,
      size: 32,
      color: "#67c23acc",
    },
    {
      num: 100,
      size: 34,
      color: "#f56c6ccc",
    },
    {
      num: 200,
      size: 36,
      color: "#e6a23ccc",
    },
  ];
  img = "/images/icon.png";
  constructor(options: { viewer: Cesium.Viewer }) {
    this.viewer = options.viewer;
    this.geojson = randomGeoJsonPoint(100, 130, 20, 40, 500);
    this.loadJson();
  }

  loadJson() {
    const geojsonPoint = new Cesium.GeoJsonDataSource()
      .load(this.geojson)
      .then((data) => {
        data.name = "point-cluster";
        this.showCluster(data);
      });
  }

  //展示聚合数据
  showCluster(geoJsonDataSource: Cesium.GeoJsonDataSource) {
    const _this = this;

    this.dataSources = geoJsonDataSource;
    this.dataSources.clustering.enabled = true;
    this.dataSources.clustering.pixelRange = 62;
    this.dataSources.clustering.minimumClusterSize = 1;
    this.viewer.dataSources.add(this.dataSources!);

    let removeListener: any;

    function customStyle() {
      if (Cesium.defined(removeListener)) {
        removeListener();
        removeListener = undefined;
      } else {
        removeListener =
          _this.dataSources?.clustering.clusterEvent.addEventListener(
            async (clusteredEntities, cluster) => {
              cluster.label.show = false;
              cluster.billboard.show = true;
              cluster.billboard.id = cluster.label.id;
              cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.CENTER;

              let xx = -1;
              for (let i = 0; i < _this.colorArr.length; i++) {
                if (clusteredEntities.length > _this.colorArr[i].num) {
                  xx = i;
                }
              }
              if (xx == -1) {
                cluster.billboard.image = _this.img;
                cluster.billboard.scale = 0.2;
              } else {
                //@ts-ignore
                cluster.billboard.image = await combineIconAndLabel(
                  "/images/school-icon.png",
                  clusteredEntities.length,
                  70
                );
                cluster.billboard.scale = 0.5;
              }
            }
          );
      }

      var pixelRange = _this.dataSources!.clustering.pixelRange;
      _this.dataSources!.clustering.pixelRange = 0;
      _this.dataSources!.clustering.pixelRange = pixelRange;
    }

    customStyle();
  }

  clickMouseLeft() {
    // 首先需要定义弹窗实例
    const dialogs = ref();
    const _this = this;
    const scene = this.viewer.scene;
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    //监听鼠标左击事件
    handler.setInputAction((e: any) => {
      // 获取点击的实体
      const pickedObject = scene.pick(e.position);
      // 判断点击的是不是点位
      if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
        const entity = pickedObject.id;
        //如果在聚合点处则不打开弹出框
        if (entity.length > 1) return;

        //获取属性信息
        const desc = entity[0].properties.getValue();
        const pos = pickedObject.primitive.position;
        const opts = {
          viewer: _this.viewer, // cesium的场景
          position: {
            _value: pos,
          },
          title: desc.name, // 弹窗标题
          content: desc.value, // 弹窗内容
        };

        if (dialogs.value) {
          // 只允许一个弹窗出现
          dialogs.value.windowClose();
        }
        // 实例化弹窗
        dialogs.value = new Dialog(opts);

        //开启高度监测，存在一点问题
        _this.watchCameraHeight(dialogs.value);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //监听选中的实体根据相机高度的变化
  watchCameraHeight(selectDialog: Dialog) {
    const viewer = this.viewer;
    const HEIGHT_THRESHOLD = 1000000; // 相机高度阈值（单位：米）
    const cameraChangedListener = viewer.camera.changed.addEventListener(() => {
      const cameraHeight = viewer.camera.positionCartographic.height;

      if (cameraHeight > HEIGHT_THRESHOLD) {
        console.log("相机高度超过阈值，执行其他处理");
        selectDialog.windowClose();
        // 移除监听器（避免重复触发）
        viewer.camera.changed.removeEventListener(cameraChangedListener);
      }
    });
  }
}

/**
 * @description: 将图片和文字合成新图标使用（参考Cesium源码）
 * @param {*} url：图片地址
 * @param {*} label：文字
 * @param {*} size：画布大小
 * @return {*} 返回canvas
 */
const combineIconAndLabel = (url: string, label: number, size: number) => {
  // 创建画布对象
  let canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  let ctx = canvas.getContext("2d");

  let promise = Cesium.Resource.fetchImage(url)?.then((image) => {
    // 异常判断
    try {
      ctx?.drawImage(image, 0, 0);
    } catch (e) {
      console.log(e);
    }

    // 渲染字体
    // font属性设置顺序：font-style, font-variant, font-weight, font-size, line-height, font-family
    ctx!.fillStyle = Cesium.Color.BLACK.toCssColorString();
    ctx!.font = "bold 28px Microsoft YaHei";
    ctx!.textAlign = "center";
    ctx!.textBaseline = "middle";
    ctx!.fillText(label, size / 2, size / 2);

    return canvas;
  });
  return promise;
};
