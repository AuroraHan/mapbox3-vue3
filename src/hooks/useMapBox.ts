import { onMounted, onUnmounted } from "vue";
import mapboxgl, { StyleSpecification } from "mapbox-gl";

interface options {
  container: string | HTMLElement;
  style?: StyleSpecification;
}

export function useMapbox(options: options) {
  let mapR: mapboxgl.Map | null = null;
  const initMap = () => {
    //pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA
    mapboxgl.accessToken =
      "pk.eyJ1IjoidTEwaW50IiwiYSI6InQtMnZvTkEifQ.c8mhXquPE7_xoB3P4Ag8cA";
    const map = new mapboxgl.Map({
      container: options.container,
      projection: "mercator",
      // style: {
      //   version: 8,
      //   sources: {
      //     m_mono: {
      //       type: "raster",
      //       tiles: ["/tile/{z}/{x}/{y}.jpg"],
      //       tileSize: 256,
      //       attribution: "",
      //     },
      //   },
      //   glyphs: "../../static/glyphs/{fontstack}/{range}.pbf",
      //   layers: [
      //     {
      //       id: "m_mono",
      //       type: "raster",
      //       source: "m_mono",
      //       minzoom: 0,
      //       maxzoom: 18,
      //     },
      //   ],
      // },
      style: "mapbox://styles/mapbox/outdoors-v12",
      // style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [120, 30],
      zoom: 2,
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
