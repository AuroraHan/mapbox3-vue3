import { ref } from "vue";
export const tools = ref([
  {
    type: "A",
    name: "工具",
    url: "",
    enable: false,
  },
  {
    type: "B",
    name: "可视化",
    url: "",
    enable: false,
  },
  {
    type: "C",
    name: "分析",
    url: "",
    enable: false,
  },
]);

export const typeA = [
  {
    id: "A1",
    name: "测试点",
    bc: null,
  },
  {
    id: "A2",
    name: "测试线",
    bc: null,
  },
  {
    id: "A3",
    name: "测试面",
    bc: null,
  },
];

export const typeB = [
  {
    id: "B1",
    name: "geojson",
    bc: null,
  },
  {
    id: "B2",
    name: "降雨图",
    bc: null,
  },
  {
    id: "B3",
    name: "测试面",
    bc: null,
  },
];
