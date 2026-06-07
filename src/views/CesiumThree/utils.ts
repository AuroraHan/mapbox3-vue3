import * as Cesium from "cesium";

// ==================== 类型定义 ====================

/**
 * 地理范围
 */
export interface GeoBounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

/**
 * 创建空的地理范围
 */
export const createEmptyBounds = (): GeoBounds => ({
  minLon: Infinity,
  maxLon: -Infinity,
  minLat: Infinity,
  maxLat: -Infinity,
});

/**
 * 重置地理范围
 */
export const resetBounds = (bounds: GeoBounds): void => {
  bounds.minLon = Infinity;
  bounds.maxLon = -Infinity;
  bounds.minLat = Infinity;
  bounds.maxLat = -Infinity;
};

// ==================== 数据加载 ====================

/**
 * 加载 GeoJSON 数据
 * @param url GeoJSON 文件路径
 */
export const fetchGeoJson = async (
  url: string = "/geojson/dep-conc-time.geojson",
) => {
  const res = await fetch(url);
  return await res.json();
};

// ==================== 颜色映射 ====================

/**
 * Log 归一化
 * @description 处理数值跨度大的情况，使用对数压缩
 */
export const normalize = (val: number): number => {
  return Math.log10(val);
};

/**
 * 获取 Cesium Color 对象（用于 Entity 材质）
 * @param val 数值
 * @param maxValue 归一化后的最大值，默认 15
 * @returns Cesium.Color 对象
 */
export const getColorForEntity = (
  val: number,
  maxValue: number = 15,
): Cesium.Color => {
  const v = normalize(val);
  const ratio = Math.min(v / maxValue, 1.0);
  // 红色(0) → 蓝色(0.7) 的 HSL 渐变
  return Cesium.Color.fromHsl((1.0 - ratio) * 0.7, 1.0, 0.5, 0.6);
};

/**
 * 获取 CSS HSLA 颜色字符串（用于 Canvas 绘制）
 * @param val 数值
 * @param maxValue 归一化后的最大值，默认 15
 * @returns HSLA 颜色字符串
 */
export const getColorForCanvas = (
  val: number,
  maxValue: number = 15,
): string => {
  const v = normalize(val);
  const ratio = Math.min(v / maxValue, 1.0);
  // 蓝色(240) → 红色(0) 的 HSL 渐变
  const h = (1.0 - ratio) * 240;
  return `hsla(${h}, 100%, 50%, 0.6)`;
};

// ==================== 数据处理 ====================

/**
 * 按 Hour 属性分组 GeoJSON 要素
 * @param geojson GeoJSON 对象
 * @returns 按 Hour 分组的 Map
 */
export const buildHourMap = (geojson: any): Map<number, any[]> => {
  const hourMap = new Map<number, any[]>();

  geojson.features.forEach((f: any) => {
    const hour = f.properties.Hour;
    if (!hourMap.has(hour)) {
      hourMap.set(hour, []);
    }
    hourMap.get(hour)!.push(f);
  });

  return hourMap;
};

/**
 * 计算所有要素的整体地理范围
 * @param geojson GeoJSON 对象
 * @param bounds 可选的现有范围对象（会被修改）
 * @returns 地理范围
 */
export const computeBounds = (geojson: any, bounds?: GeoBounds): GeoBounds => {
  const result = bounds || createEmptyBounds();

  geojson.features.forEach((f: any) => {
    const coords = f.geometry.coordinates[0];
    coords.forEach(([lon, lat]: number[]) => {
      result.minLon = Math.min(result.minLon, lon);
      result.maxLon = Math.max(result.maxLon, lon);
      result.minLat = Math.min(result.minLat, lat);
      result.maxLat = Math.max(result.maxLat, lat);
    });
  });

  return result;
};

/**
 * 获取 GeoJSON 的中心点坐标
 * @param bounds 地理范围
 * @returns [经度, 纬度]
 */
export const getBoundsCenter = (bounds: GeoBounds): [number, number] => {
  return [
    (bounds.minLon + bounds.maxLon) / 2,
    (bounds.minLat + bounds.maxLat) / 2,
  ];
};

// ==================== Canvas 绘制 ====================

/**
 * 经纬度坐标转 Canvas 像素坐标
 * @param lon 经度
 * @param lat 纬度
 * @param width Canvas 宽度
 * @param height Canvas 高度
 * @param bounds 地理范围
 * @returns [x, y] 像素坐标
 */
export const projectToCanvas = (
  lon: number,
  lat: number,
  width: number,
  height: number,
  bounds: GeoBounds,
): [number, number] => {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width;
  const y =
    height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
  return [x, y];
};

/**
 * Canvas 热力图绘制配置
 */
export interface HeatmapOptions {
  width?: number;
  height?: number;
  blur?: number;
  maxValue?: number;
}

/**
 * 在 Canvas 上绘制热力图
 * @param features GeoJSON 要素数组
 * @param bounds 地理范围
 * @param options 绘制配置
 * @returns 绘制完成的 Canvas 元素
 */
export const drawHeatmapOnCanvas = (
  features: any[],
  bounds: GeoBounds,
  options: HeatmapOptions = {},
): HTMLCanvasElement => {
  const { width = 1024, height = 1024, blur = 8, maxValue = 15 } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;

  features.forEach((f: any) => {
    const coords = f.geometry.coordinates[0];
    const conc = f.properties.Conc;

    if (!conc) return;

    ctx.beginPath();

    coords.forEach(([lon, lat]: number[], i: number) => {
      const [x, y] = projectToCanvas(lon, lat, width, height, bounds);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.fillStyle = getColorForCanvas(conc, maxValue);
    ctx.filter = `blur(${blur}px)`;
    ctx.fill();
  });

  return canvas;
};

/**
 * 预计算所有时间点的 Canvas
 * @param hourMap 按 Hour 分组的要素 Map
 * @param bounds 地理范围
 * @param options 绘制配置
 * @returns Canvas 缓存 Map
 */
export const precomputeCanvas = async (
  hourMap: Map<number, any[]>,
  bounds: GeoBounds,
  options: HeatmapOptions = {},
): Promise<Map<number, HTMLCanvasElement>> => {
  const canvasCache = new Map<number, HTMLCanvasElement>();

  for (const [hour, features] of hourMap) {
    const canvas = drawHeatmapOnCanvas(features, bounds, options);
    canvasCache.set(hour, canvas);
    // 让出主线程，防止 UI 卡顿
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  console.log(`Canvas 预计算完成，共 ${canvasCache.size} 个`);
  return canvasCache;
};

// ==================== Cesium 辅助 ====================

/**
 * 创建 Rectangle 坐标
 * @param bounds 地理范围
 * @returns Cesium.Rectangle
 */
export const createRectangle = (bounds: GeoBounds): Cesium.Rectangle => {
  return Cesium.Rectangle.fromDegrees(
    bounds.minLon,
    bounds.minLat,
    bounds.maxLon,
    bounds.maxLat,
  );
};

/**
 * 创建 Cartesian3 飞行目标位置
 * @param bounds 地理范围
 * @param height 相对于地面的高度
 * @returns Cartesian3 位置
 */
export const createFlyToPosition = (
  bounds: GeoBounds,
  height: number = 2000000,
): Cesium.Cartesian3 => {
  const [lon, lat] = getBoundsCenter(bounds);
  return Cesium.Cartesian3.fromDegrees(lon, lat, height);
};

/**
 * 创建 SingleTileImageryProvider
 * @param canvas Canvas 元素
 * @param bounds 地理范围
 * @returns SingleTileImageryProvider
 */
export const createSingleTileProvider = (
  canvas: HTMLCanvasElement,
  bounds: GeoBounds,
): Cesium.SingleTileImageryProvider => {
  return new Cesium.SingleTileImageryProvider({
    url: canvas.toDataURL(),
    rectangle: createRectangle(bounds),
    tileWidth: 256,
    tileHeight: 256,
  });
};
