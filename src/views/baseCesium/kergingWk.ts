// 由于cesium代码中使用到了global，但是worker中不能使用
// 所以第一种办法是将cesium代码在主线程解决,传递处理好的数据进来
// 第二章办法是在vite的配置项中添加  define: {global: 'globalThis'}  即可解决
import { Cartesian3, Math as CesiumMath, PolygonGeometry } from "cesium";
import krigingExport from "kriging";
const { kriging } = krigingExport;

type GridOptions = {
  lngs: number[];
  lats: number[];
  vals: number[];
  polygon: [number, number][];
  asynchronous: boolean;
  mode: "gaussian" | "exponential" | "spherical";
  sigma2: number;
  alpha: number;
  gridDivideNum: number;
};

self.onmessage = (e) => {
  const options = e.data as GridOptions;
  const grid = generateGrid(options);

  self.postMessage(grid);
};

function generateGrid(options: GridOptions) {
  const { lngs, lats, vals, polygon, mode, sigma2, alpha, gridDivideNum } =
    options;
  const polygonCartesians = Cartesian3.fromDegreesArray(polygon.flat());
  const polygonExtentRect =
    PolygonGeometry.computeRectangleFromPositions(polygonCartesians);
  const minx = CesiumMath.toDegrees(polygonExtentRect.west);
  const miny = CesiumMath.toDegrees(polygonExtentRect.south);
  const maxx = CesiumMath.toDegrees(polygonExtentRect.east);
  const maxy = CesiumMath.toDegrees(polygonExtentRect.north);
  const polygonExtentCoords = [
    [
      [minx, miny],
      [maxx, miny],
      [maxx, maxy],
      [minx, maxy],
    ],
  ] as [number, number][][];

  const variogram = kriging.train(vals, lngs, lats, mode, sigma2, alpha);
  const grid = kriging.grid(
    polygonExtentCoords,
    variogram,
    (maxx - minx) / gridDivideNum
  );

  return grid;
}
