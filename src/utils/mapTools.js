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
    let y = Math.log(Math.tan((Math.PI / 4) + (Math.PI / 360) * lat)) * RADIUS / Math.PI;

    // 确保 y 值在 Web 墨卡托投影的范围内
    y = Math.min(Math.max(y, -RADIUS), RADIUS);

    return { x, y };
}

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
    const lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((y / RADIUS) * Math.PI)) - Math.PI / 2);

    return { lon, lat };
}