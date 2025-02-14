import mapboxgl from "mapbox-gl";

/**
 * 经纬度坐标转为web墨卡托坐标
 * @param {*} lat 纬度
 * @param {*} lon 经度
 * @returns 墨卡托坐标
 */
export const latLonToWebMercator = (lon, lat) => {
  const RADIUS = 20037508.34; // Web墨卡托半径常数

  // X 坐标转换（经度）
  const x = (lon * RADIUS) / 180;

  // Y 坐标转换（纬度）
  let y =
    (Math.log(Math.tan(Math.PI / 4 + (Math.PI / 360) * lat)) * RADIUS) /
    Math.PI;

  // 确保 y 值在 Web 墨卡托投影的范围内
  y = Math.min(Math.max(y, -RADIUS), RADIUS);

  return { x, y };
};

/**
 * 墨卡托坐标转为经纬度坐标
 * @param {*} x
 * @param {*} y
 * @returns 经纬度坐标
 */
export const webMercatorToLatLon = (x, y) => {
  const RADIUS = 20037508.34; // Web墨卡托半径常数

  // 经度转换
  const lon = (x / RADIUS) * 180;

  // 纬度转换
  const lat =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((y / RADIUS) * Math.PI)) - Math.PI / 2);

  return { lon, lat };
};

/**
 * 移除 需要先移除图层再移除资源
 * @param map map实例
 * @param layerName 图层名称
 * @param type 类别 0:资源 1:图层 2:图片
 */
export const removeLayerAndSource = (
  map: mapboxgl.Map,
  labelName: string,
  type: number
) => {
  //移除资源
  if (type == 0) {
    if (map.getSource(labelName)) {
      map.removeSource(labelName);
    }
  }

  //移除图层
  if (type == 1) {
    if (map.getLayer(labelName)) {
      map.removeLayer(labelName);
    }
  }

  //移除图片资源
  if (type == 2) {
    if (map.hasImage(labelName)) {
      map.removeImage(labelName);
    }
  }
};

/**
 *
 * @param map 地图实例
 * @param center 飞行中心点
 * @param zoom 层级
 */
export const flyTo = (
  map: mapboxgl.Map,
  center: [number, number],
  zoom: number = 9
) => {
  try {
    map.flyTo({
      // 中心点
      center: center,
      // 层级
      zoom: zoom,
      // 角度
      pitch: 0,
      bearing: 0,
      speed: 0.8,
      curve: 3,
      essential: true,
      easing: function (t) {
        return t;
      },
    });
  } catch (error) {
    console.log("地图飞行方法错误!", error);
  }
};

//创建图片dom
export const createImg = (url) => {
  const domI = document.createElement("div");
  domI.style.width = "50px";
  domI.style.height = "50px";
  domI.style.backgroundImage = `url(${url})`;
  domI.style.backgroundRepeat = "no-repeat";
  domI.style.backgroundSize = "100%";

  return domI;
};
