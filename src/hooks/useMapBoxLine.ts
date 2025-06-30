import { onMounted, onUnmounted } from "vue";
import mapboxgl, { StyleSpecification } from "mapbox-gl";

interface options {
    container: string | HTMLElement;
    // style?: StyleSpecification;
    isOffline?: boolean; //是否使用离线地图
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
            style: "mapbox://styles/mapbox/outdoors-v12",
            center: [120, 30],
            zoom: 2,
            preserveDrawingBuffer: true,
        });

        mapR = map;
        mapR.removeControl(mapR._logoControl);

        map.on("style.load", () => {
            // 设置地球背景
            map.setFog({
                color: "rgb(186, 210, 235)",
                "high-color": "rgb(36, 92, 223)",
                "horizon-blend": 0.02,
                "space-color": "rgb(11, 11 ,25)",
                "star-intensity": 0.6,
            });
        });
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
