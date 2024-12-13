import { onMounted } from "vue";
import mapboxgl, { StyleSpecification } from "mapbox-gl";

interface options {
  container: string | HTMLElement;
  style?: StyleSpecification;
}

export function useMapbox(options: options) {
  let mapR: mapboxgl.Map | null = null;
  const initMap = () => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiaHBqbmYiLCJhIjoiY20yMzU5OGhzMDI2NjJrb2kweG5yYWRuZSJ9.HX3dEC4HuYwKuA3_Fm2wXA";
    const map = new mapboxgl.Map({
      container: options.container,
      projection: "mercator",
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [120, 30],
      zoom: 2,
    });

    mapR = map;
  };

  onMounted(() => {
    initMap();
  });

  const getMap = () => {
    return mapR;
  };

  return {
    getMap,
  };
}
