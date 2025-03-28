/**
 * {
 *      name:名称
 *      id:唯一值
 *      typeName:图层名称
 *      type:图层类别 （vector,raster,raster-dem,geojson,fill-extrusion）
 *      dataSourceName:数据资料分类
 *      sourceLayer:数据资源图层（在wtms服务的FORMAT=application/vnd.mapbox-vector-tile时使用，必须和图层名称一致）
 *      tiles:路径地址
 *      tileSize:切片大小
 *      minzoom:最小缩放
 *      maxzoom:最大缩放
 *      enabled:默认启用（唯一一个）
 *      layerType:绘制类型 （fill填充,circle圆点,line线条）
 *      paint:绘制对象
 *      layout:布局对象
 *      textLayout：文字布局
 *      textPaint：文字绘制对象
 *      wms: true （是否为wms服务）
 *      scheme:tms  (切片模式)
 *      enableText:是否开启文本显示
 * }
 */
export const mapStyle = [
  {
    name: "默认地图",
    id: "defaultmap",
    typeName: "矢量地图",
    type: "raster", //栅格类型
    dataSourceName: "地图",
    tiles: ["/tile/{z}/{x}/{y}.jpg"],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 18,
    enabled: true,
  },
  {
    name: "全球矢量",
    id: "pbf-world",
    typeName: "矢量地图",
    type: "vector", //矢量类型
    dataSourceName: "地图",
    tiles: [
      "http://127.0.0.1:10001/geoserver/ne/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=ne:countries&STYLE=ne:countries_mapcolor9&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}",
    ],
    sourceLayer: "countries",
    minzoom: 0,
    maxzoom: 18,
    enabled: false,
    layerType: "fill",
    paint: {
      "fill-color": "#ffdd44",
      "fill-outline-color": "#000000",
    },
    layout: {
      "line-cap": "round",
    },
  },
  {
    name: "世界地图",
    id: "sjdtwmts",
    type: "raster", //栅格类型 使用wmts服务
    typeName: "栅格地图",
    dataSourceName: "地图",
    tiles: [
      "geoserverApi/geoserver/ne/gwc/service/wmts?layer=ne%3Acountries&style=ne%3Acountries&tilematrixset=EPSG%3A900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix=EPSG%3A900913:{z}&TileCol={x}&TileRow={y}",
    ],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 18,
    enabled: false,
  },
  {
    name: "世界地图tms",
    id: "sjdtwmtstms",
    type: "raster", //栅格类型 使用wmts服务
    typeName: "栅格地图",
    dataSourceName: "地图",
    tiles: [
      "geoserverApi/geoserver/gwc/service/tms/1.0.0/ne%3Acountries@EPSG%3A900913@png/{z}/{x}/{y}.png",
    ],
    scheme: "tms",
    tileSize: 256,
    minzoom: 0,
    maxzoom: 18,
    enabled: false,
  },
  {
    name: "世界彩色地图",
    id: "sjcsdt",
    type: "raster", //栅格类型
    typeName: "栅格地图",
    dataSourceName: "地图",
    tiles: [
      "geoserverApi/geoserver/ne/wms?service=WMS&version=1.1.0&request=GetMap&layers=ne%3Acountries&bbox={bbox-epsg-3857}&width=768&height=370&srs=EPSG%3A3857&styles=&format=image%2Fjpeg",
    ],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 18,
    enabled: false,
  },
  {
    name: "中国地形图",
    id: "zgdxt",
    type: "raster-dem", //高程类型
    typeName: "高程地图",
    dataSourceName: "地形",
    tiles: ["/tiles/dem/nan-hai/{z}/{x}/{y}.png"],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 18,
    enabled: false,
  },
  {
    name: "美国人口地图",
    id: "mgrkdt",
    type: "geojson", //
    typeName: "栅格地图",
    dataSourceName: "人口分布数据库",
    layerType: "fill", //polygon 多边形  line 线   point 点
    url: "geoserverApi/geoserver/topp/wms?service=WMS&version=1.1.0&request=GetMap&layers=topp%3Astates&bbox=$sw_lng$,$sw_lat$,$ne_lng$,$ne_lat$&width=768&height=330&srs=EPSG%3A4326&styles=&format=geojson",
    wms: true,
    layout: {},
    paint: {
      "fill-color": "#ffee88",
      "fill-outline-color": "#ff0000",
    },
    enableText: false, //开启文本显示
    enabled: false,
  },
  {
    name: "世界城市分布",
    id: "worldcity",
    type: "geojson", //
    typeName: "栅格地图",
    dataSourceName: "人口分布数据库",
    layerType: "circle", //polygon 多边形  line 线   point 点
    url: "geoserverApi/geoserver/ne/wms?service=WMS&version=1.1.0&request=GetMap&layers=ne%3Apopulated_places&bbox=$sw_lng$,$sw_lat$,$ne_lng$,$ne_lat$&width=768&height=330&srs=EPSG%3A4326&styles=&format=geojson",
    wms: true,
    layout: {},
    paint: {
      "circle-color": "#ffee88",
      "circle-radius": 5,
    },
    textLayout: {
      "text-font": ["Microsoft YaHei Bold"],
      "text-field": ["get", "name"],
      "text-size": 16,
      "text-offset": [0, 1.5],
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    textPaint: {
      "text-color": "aqua",
    },
    enableText: true, //开启文本显示
    enabled: false,
  },
  {
    name: "区域道路",
    id: "hlsw",
    type: "geojson", //
    dataSourceName: "水文数据库",
    typeName: "",
    layerType: "line",
    url: "geoserverApi/geoserver/sf/wms?service=WMS&version=1.1.0&request=GetMap&layers=sf%3Aroads&bbox=$sw_lng$,$sw_lat$,$ne_lng$,$ne_lat$&width=768&height=537&srs=EPSG%3A4326&styles=&format=geojson",
    wms: true,
    layout: {
      "line-cap": "round",
    },
    paint: {
      "line-color": "#ffee88",
      "line-width": 2,
    },
    enableText: false, //开启文本显示
    enabled: false,
  },
  {
    name: "全球降雨量",
    id: "qqjyl",
    type: "raster", //栅格类型 使用wmts服务
    typeName: "栅格地图",
    dataSourceName: "地图",
    tiles: [
      "geoserverApi/geoserver/nurc/gwc/service/wmts?layer=nurc%3AArc_Sample&style=&tilematrixset=EPSG%3A900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix=EPSG%3A900913:{z}&TileCol={x}&TileRow={y}",
    ],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 18,
    enabled: false,
  },
  {
    name: "湖北地区建筑物",
    id: "hbdq",
    type: "fill-extrusion", //三维
    typeName: "矢量地图",
    dataSourceName: "建筑物分布数据库",
    layerType: "",
    tiles: [
      "http://127.0.0.1:10001/geoserver/gxh/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=gxh:whbuiding&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}",
    ],
    wms: false,
    sourceLayer: "whbuiding",
    layout: {},
    paint: {
      "fill-extrusion-color": "red",
      "fill-extrusion-height": ["*", ["to-number", ["get", "height"]], 10],
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 1,
    },
    enableText: false, //开启文本显示
    enabled: false,
  },
];
