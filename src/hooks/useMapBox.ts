import { onMounted, onUnmounted } from "vue";
import mapboxgl, { StyleSpecification } from "mapbox-gl";

interface options {
  container: string | HTMLElement;
  // style?: StyleSpecification;
  isOffline?: boolean; //是否使用离线地图
}

export function useMapbox(options: options) {
  let mapR: mapboxgl.Map | null = null;

  let style;

  //是否使用离线地图
  if (options.isOffline) {
    style = {
      version: 8,
      sources: {
        m_mono: {
          type: "raster",
          tiles: ["/tile/{z}/{x}/{y}.jpg"],
          tileSize: 256,
          attribution: "",
        },
      },
      glyphs: "../../static/glyphs/{fontstack}/{range}.pbf",
      // sprite: "http://127.0.0.1:4000/static/sprite",
      layers: [
        {
          id: "m_mono",
          type: "raster",
          source: "m_mono",
          minzoom: 0,
          maxzoom: 18,
        },
      ],
    };
  } else {
    // style = "mapbox://styles/mapbox/dark-v11";
    style = "mapbox://styles/mapbox/outdoors-v12";
    // style = "mapbox://styles/mapbox/satellite-v9";
  }

  const initMap = () => {
    //pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA
    mapboxgl.accessToken =
      "pk.eyJ1IjoidTEwaW50IiwiYSI6InQtMnZvTkEifQ.c8mhXquPE7_xoB3P4Ag8cA";
    const map = new mapboxgl.Map({
      container: options.container,
      projection: "mercator",
      style: style,
      // style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [120, 30],
      zoom: 2,
      preserveDrawingBuffer: true,
    });

    mapR = map;
    mapR.removeControl(mapR._logoControl);
  };

  onMounted(() => {
    initMap();
  });

  onUnmounted(() => {
    mapR?.remove();
    mapR = null;
  });

  const getMap = () => {
    return mapR;
  };

  return {
    getMap,
  };
}
