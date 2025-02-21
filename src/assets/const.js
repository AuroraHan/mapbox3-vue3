import { ref } from "vue";
export const antGeojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        coordinates: [
          [114.4, 38], //
          [114.4, 37.08],
          [114.2, 35.7],
          [113.9, 35.2],
          [113.5, 34.7],
          [113, 33.5],
          [114, 32.16], //
          // [114, 12],
          // [114, 18],
          // [114, 22],
          // [114, 32],
        ],
        type: "LineString",
      },
    },
  ],
};

export const equipmentList = ref([
  {
    id: 1,
    name: "红旗",
    svg: "/images/equipment/hongqi.svg",
    enable: false,
  },
  {
    id: 2,
    name: "监测站",
    svg: "/images/equipment/jiancezhan.svg",
    enable: false,
  },
  {
    id: 3,
    name: "降落伞",
    svg: "/images/equipment/jiangluosan.svg",
    enable: false,
  },
  {
    id: 4,
    name: "空投",
    svg: "/images/equipment/kongtou.svg",
    enable: false,
  },
]);
