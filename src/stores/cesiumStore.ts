import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";

export const useCesiumEventStore = defineStore("cesiumEvent", () => {

  // 鼠标移动的经纬度
  const mouseMovePostion = ref({ longitude: 0, latitude: 0, height: 0 });
  // 鼠标左键点击的经纬度
  const leftClickPosition = ref({ longitude: 0, latitude: 0, height: 0 });
  // 鼠标右键点击的经纬度
  const rightClickPosition = ref({ longitude: 0, latitude: 0, height: 0 });
  // 当前视角所在层级
  const bounds = reactive({
    topLeft: { lon: null, lat: null },
    bottomRight: { lon: null, lat: null },
    level: 0,
  });
  const changeMouseMovePosition = (val: typeof mouseMovePostion.value) => {
    mouseMovePostion.value = { ...val };
  };
  const changeLeftClickPosition = (val: typeof leftClickPosition.value) => {
    leftClickPosition.value = { ...val };
  };
  const changeRightClickPosition = (val: typeof rightClickPosition.value) => {
    rightClickPosition.value = { ...val };
  };
  const changeCameraBounds = (val: typeof bounds) => {
    bounds.topLeft = val.topLeft;
    bounds.bottomRight = val.bottomRight;
    bounds.level = val.level;
  };
  const position = computed(() => {
    return {
      left: { ...leftClickPosition.value },
      right: { ...rightClickPosition.value },
      mouse: { ...mouseMovePostion.value },
    };
  });
  return {
    mouseMovePostion,
    leftClickPosition,
    rightClickPosition,
    position,
    bounds,
    changeMouseMovePosition,
    changeLeftClickPosition,
    changeRightClickPosition,
    changeCameraBounds,
  };
});
