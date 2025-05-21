import * as Cesium from "cesium";
//添加建筑物
const addBuilding = async (cesiumV: Cesium.Viewer) => {
  const tilesetBuild = await Cesium.createOsmBuildingsAsync();
  cesiumV.scene.primitives.add(tilesetBuild);
};

/**
 *  生产指定范围内的随机点，返回GeoJson的点位
 * @param minLon
 * @param maxLon
 * @param minLat
 * @param maxLat
 * @param num
 * @returns
 */
export const randomGeoJsonPoint = (
  minLon: number,
  maxLon: number,
  minLat: number,
  maxLat: number,
  num: number
) => {
  let points = {
    type: "FeatureCollection",
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Point>;
  for (let i = 0; i < num; i++) {
    let point = {
      type: "Feature",
      properties: {
        value: Number(Math.random() * 100).toFixed(1),
        name: "mack" + (Math.random() * num).toFixed(0),
      },
      geometry: {
        type: "Point",
        coordinates: [
          Math.random() * (maxLon - minLon) + minLon,
          Math.random() * (maxLat - minLat) + minLat,
        ],
      },
    } as GeoJSON.Feature<GeoJSON.Point>;
    points.features.push(point);
  }
  return points;
};
