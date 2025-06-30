import * as Cesium from "cesium";
import krigingExport from "kriging";
const { kriging } = krigingExport;

//-----------------色斑图--------------
// 平均年降水量，单位mm。适用范围：江西
const jxPrecipitationColors = [
  { min: 0, max: 1000, color: "#7fffff" },
  { min: 1000, max: 1100, color: "#23b7ff" },
  { min: 1100, max: 1200, color: "#0177b4" },
  { min: 1200, max: 1400, color: "#0052ca" },
  { min: 1400, max: 1600, color: "#0310d8" },
  { min: 1600, max: 1800, color: "#9601f9" },
  { min: 1800, max: 2000, color: "#6f00b8" },
  { min: 2000, max: 10000, color: "#4c0082" },
];

//降雨色斑图
export const stainRain = async (cesiumV: Cesium.Viewer) => {
  // 绘制色斑图需要的数据
  const lngs: number[] = []; //经度数组
  const lats: number[] = []; //纬度数组
  const vals: number[] = []; //数值数组
  const mode: "gaussian" | "exponential" | "spherical" = "exponential"; //变异函数模型
  const sigma2 = 0; // (σ2)高斯过程的方差参数
  const alpha = 100; // (α)变异函数模型的先验
  const gridDivideNum = 500; // 根据格网的宽度/该数量划分格网单元大小

  // 加载江西省各县年平均降水量数据
  const precipitationProm = await fetch("/geojson/jxPrecipitation.geojson");
  const precipitationData = await precipitationProm.json();
  precipitationData.features.forEach((item: any) => {
    const geom = item.geometry;
    const prop = item.properties;
    lngs.push(geom.coordinates[0]);
    lats.push(geom.coordinates[1]);
    vals.push(prop.y2020);

    cesiumV.entities.add({
      position: Cesium.Cartesian3.fromDegrees(
        geom.coordinates[0],
        geom.coordinates[1]
      ),
      point: {
        pixelSize: 6,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
      },
      label: {
        text: prop.country + " " + Number(prop.y2020).toFixed(0) + "毫米",
        fillColor: Cesium.Color.WHEAT,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(6, 11),
        font: "15px TimesNewRoman",
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
          2000,
          1200000
        ),
      },
    });
  });
  // 加载江西省矢量
  const jxProm = await fetch("/geojson/jiangxi.geojson");
  const jxData = await jxProm.json();
  const jxPolygon = jxData.features[0].geometry.coordinates[0] as [
    number,
    number
  ][][];
  const polygonCartesians = Cesium.Cartesian3.fromDegreesArray(
    jxPolygon[0].flat()
  );

  // 绘制矢量
  cesiumV.entities.add({
    polygon: {
      hierarchy: polygonCartesians,
      fill: false,
      outline: true,
      outlineWidth: 4,
      outlineColor: Cesium.Color.YELLOW,
    },
  });

  const grid = await generateGrid({
    lngs,
    lats,
    vals,
    polygon: jxPolygon[0],
    asynchronous: true,
    mode: "exponential",
    sigma2: 0,
    alpha: 100,
    gridDivideNum: 500,
  });

  // 进行绘图
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1000;
  canvas.style.display = "block";
  canvas.getContext("2d")!.globalAlpha = 0.7;
  // console.time('绘图')
  newPlot(canvas, grid, grid.xlim, grid.ylim, jxPrecipitationColors);
  // console.timeEnd('绘图')
  // 下载绘制出的图片进行查看
  // const imgUrl = canvas.toDataURL('image/jpeg')
  // const link = document.createElement('a')
  // link.href = imgUrl
  // link.download = 'scene.jpeg'
  // link.click()

  const polygonGeom = new Cesium.PolygonGeometry({
    polygonHierarchy: new Cesium.PolygonHierarchy(polygonCartesians),
  });
  const primitive = new Cesium.GroundPrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: polygonGeom,
    }),
    appearance: new Cesium.Appearance({
      material: Cesium.Material.fromType("Image", {
        image: canvas,
      }),
    }),
  });
  const rainPngPri = cesiumV.scene.primitives.add(primitive);
  return rainPngPri;
};

//绘图方法
const newPlot = (
  canvas: HTMLCanvasElement,
  grid: any,
  xlim: number[],
  ylim: number[],
  colors: any
) => {
  let ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let range = [
    xlim[1] - xlim[0],
    ylim[1] - ylim[0],
    grid.zlim[1] - grid.zlim[0],
  ];
  let i, j, x, y, z;
  let n = grid.length;
  let m = grid[0].length;
  let wx = Math.ceil((grid.width * canvas.width) / (xlim[1] - xlim[0]));
  let wy = Math.ceil((grid.width * canvas.height) / (ylim[1] - ylim[0]));
  for (i = 0; i < n; i++) {
    for (j = 0; j < m; j++) {
      if (grid[i][j] == undefined) continue;
      x = (canvas.width * (i * grid.width + grid.xlim[0] - xlim[0])) / range[0];
      y =
        canvas.height *
        (1 - (j * grid.width + grid.ylim[0] - ylim[0]) / range[1]);
      z = (grid[i][j] - grid.zlim[0]) / range[2];
      if (z < 0.0) z = 0.0;
      if (z > 1.0) z = 1.0;
      ctx.fillStyle = getColor(colors, grid[i][j]);
      ctx.fillRect(Math.round(x - wx / 2), Math.round(y - wy / 2), wx, wy);
    }
  }
};

type ColorOpt = { min: number; max: number; color: string };

//获取颜色数值
const getColor = (colors: ColorOpt[], z: number) => {
  const len = colors.length;
  let minVal = colors[0].min;
  for (var i = 0; i < len; i++) {
    minVal = Math.min(minVal, colors[i].min);
    if (z >= colors[i].min && z < colors[i].max) return colors[i].color;
  }
  if (z <= minVal) {
    return colors[0].color;
  } else {
    return colors[len - 1].color;
  }
};

//灵活使用webworke
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

//生成网格
const generateGrid = (options: GridOptions) => {
  return new Promise<any>((resolve) => {
    const { lngs, lats, vals, polygon, mode, sigma2, alpha, gridDivideNum } =
      options;
    if (!options.asynchronous) {
      const polygonCartesians = Cesium.Cartesian3.fromDegreesArray(
        polygon.flat()
      );

      //寻找边界框的4个值
      const polygonExtentRect =
        Cesium.PolygonGeometry.computeRectangleFromPositions(polygonCartesians);

      const minx = Cesium.Math.toDegrees(polygonExtentRect.west);
      const miny = Cesium.Math.toDegrees(polygonExtentRect.south);
      const maxx = Cesium.Math.toDegrees(polygonExtentRect.east);
      const maxy = Cesium.Math.toDegrees(polygonExtentRect.north);
      const polygonExtentCoords = [
        [
          [minx, miny],
          [maxx, miny],
          [maxx, maxy],
          [minx, maxy],
        ],
      ] as [number, number][][];
      // 训练并得到格网
      const variogram = kriging.train(vals, lngs, lats, mode, sigma2, alpha);
      const grid = kriging.grid(
        polygonExtentCoords,
        variogram,
        (maxx - minx) / gridDivideNum
      );

      resolve(grid);
    } else {
      const worker = new Worker(new URL("./kergingWk.ts", import.meta.url), {
        type: "module",
      });
      worker.postMessage(options);
      worker.onmessage = (e) => {
        const grid = e.data;
        resolve(grid);
      };
    }
  });
};
