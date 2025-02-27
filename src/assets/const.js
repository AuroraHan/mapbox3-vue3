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

export const windList = [
  {
    id: 1,
    code: "F1513",
    name: "浦口镇",
    latitude: 25.4828,
    longitude: 119.3231,
    // 风力级别
    jibie: 1,
    // 风向
    fengxiang: 153,
  },
  {
    id: 2,
    code: "F8910",
    name: "济阳乡",
    latitude: 25.5059,
    longitude: 119.3202,
    jibie: 2,
    fengxiang: 34,
  },
  {
    id: 3,
    code: "F8212",
    name: "济村乡",
    latitude: 25.4685,
    longitude: 119.3011,
    jibie: 3,
    fengxiang: 225,
  },
  {
    id: 4,
    code: "F1813",
    name: "流水中学",
    latitude: 25.4399,
    longitude: 119.3037,
    jibie: 4,
    fengxiang: 56,
  },
];
