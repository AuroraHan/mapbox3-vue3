import * as Cesium from 'cesium';
/**
 * 将笛卡尔坐标数组转换为经纬度数组（带有效性校验）
 * @param {cesium.Cartesian3[]} cartesians - 笛卡尔坐标数组
 * @returns {number[][]|null} 经纬度数组（[lng, lat]）或null（存在无效坐标）
 */
export function convertCartesiansToDegrees(cartesians: Array<Cesium.Cartesian3>) {
    const coordinates = [];
    for (const cartesian of cartesians) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        if (!cartographic) return null; // 无效笛卡尔坐标

        // 过滤极值点（纬度超出[-90,90]或经度超出[-180,180]）
        const lng = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;

        coordinates.push([lng, lat]);
    }
    return coordinates;
}

/**
 * 确保多边形闭合（处理浮点精度问题）
 * @param {number[][]} coordinates - 经纬度数组（[lng, lat]）
 * @returns {number[][]} 闭合后的经纬度数组
 */
export function ensurePolygonClosed(coordinates: number[][]) {
    if (coordinates.length === 0) return coordinates;

    // 提取首尾点（转换为数值数组避免引用问题）
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];

    // 使用小量epsilon判断是否接近（解决浮点精度问题）
    const isClosed = first.every(
        (val, idx) => Math.abs(val - last[idx]) < 1e-6 // 1e-6度的精度足够应对大多数场景
    );

    return isClosed ? coordinates : [...coordinates, first];
}

/**
 * 自适应格式化面积文本（平方公里/公顷）
 * @param {number} squareMeters - 面积（平方米）
 * @returns {string} 格式化后的面积文本
 */
export function formatAreaText(squareMeters: number) {
    if (squareMeters < 1e4) {
        // 小于1公顷（1公顷=1e4平方米）
        return `${(squareMeters / 1e4).toFixed(4)} 公顷`;
    } else if (squareMeters < 1e6) {
        // 1公顷到1平方公里之间
        return `${(squareMeters / 1e4).toFixed(2)} 公顷（${(squareMeters / 1e6).toFixed(4)} 平方公里）`;
    } else {
        // 大于等于1平方公里
        return `${(squareMeters / 1e6).toFixed(4)} 平方公里`;
    }
}
