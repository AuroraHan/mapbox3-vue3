// 1、cesium事件封装
import * as Cesium from "cesium";
import { debounce, getViewBounds } from "./cesiumTools";
import { useCesiumEventStore } from '/@/stores/cesiumStore'

interface PosI {
    longitude: number,
    latitude: number,
    altitude: number,
    height: number
}

/**
 * 定义事件类型常量
 */
const EVENT_TYPES = {
    LEFT_CLICK: Cesium.ScreenSpaceEventType.LEFT_CLICK,
    MOUSE_MOVE: Cesium.ScreenSpaceEventType.MOUSE_MOVE,
    RIGHT_CLICK: Cesium.ScreenSpaceEventType.RIGHT_CLICK,
    CAMERA_CHANGED: "changed",
};

/**
 * 定义 Store 方法的映射关系（事件类型 -> Store 方法）
 */
const STORE_ACTION_MAP = {
    [EVENT_TYPES.LEFT_CLICK]: (pos: PosI) => useCesiumEventStore().changeLeftClickPosition(pos),
    [EVENT_TYPES.MOUSE_MOVE]: (pos: PosI) => useCesiumEventStore().changeMouseMovePosition(pos),
    [EVENT_TYPES.RIGHT_CLICK]: (pos: PosI) => useCesiumEventStore().changeRightClickPosition(pos),
    [EVENT_TYPES.CAMERA_CHANGED]: (bounds: any) => useCesiumEventStore().changeCameraBounds(bounds),
}

/**
 * 定义事件处理函数的映射关系（事件类型 -> 处理函数名）
 */
const EVENT_HANDLER_MAP = {
    [EVENT_TYPES.LEFT_CLICK]: "leftClick",
    [EVENT_TYPES.MOUSE_MOVE]: "mouseMove",
    [EVENT_TYPES.RIGHT_CLICK]: "rightClick",
};

/**
 * Cesium 事件管理类
*/
export class CesiumEvent {
    handler: Cesium.ScreenSpaceEventHandler | null;
    viewer: Cesium.Viewer;
    position: PosI | null;
    bounds: null;

    constructor(viewer: Cesium.Viewer) {
        // 统一事件声明
        this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        this.viewer = viewer;
        this.position = null; // 存储当前位置信息（CesiumPosition 类型）
        this.bounds = null;
        this.initEvent();
    }

    /**
     * 初始化事件绑定
     */
    initEvent() {
        Object.entries(EVENT_HANDLER_MAP).forEach(([eventType, handlerName]) => {
            //@ts-ignore
            const handler = this[handlerName]; // 获取对应的处理函数
            if (typeof handler === "function") {
                // 绑定事件，注意保持 this 上下文
                //@ts-ignore
                this.handler?.setInputAction((movement: any) => handler.call(this, movement), eventType);
            }
        });

        this.viewer.camera.changed.addEventListener(
            debounce(() => this.handleCameraChanged(this.viewer), 300)
        );
    }

    /**
     * 左键点击事件处理
     *  movement - 事件对象
     */
    leftClick(movement: any) {
        this.handlePosition(movement.position, EVENT_TYPES.LEFT_CLICK);
    }

    /**
     * 鼠标移动事件处理
     */
    mouseMove(movement: any) {
        this.handlePosition(movement.endPosition, EVENT_TYPES.MOUSE_MOVE);
    }

    /**
     * 右键点击事件处理
     * 
     */
    rightClick(movement: any) {
        this.handlePosition(movement.position, EVENT_TYPES.RIGHT_CLICK);
    }

    /**
     * 统一处理位置计算与存储（核心逻辑）
     * @param {Cesium.Cartesian2|undefined} position - 屏幕坐标（可能为 undefined）
     * @param {string} eventType - 事件类型
     */
    handlePosition(position: Cesium.Cartesian2 | undefined, type: Cesium.ScreenSpaceEventType) {
        if (!Cesium.defined(position)) return; // 屏幕坐标无效时跳过
        const cartesian = this.viewer.scene.pickPosition(position);
        if (!Cesium.defined(cartesian)) {
            // console.warn('未命中有效地形/模型位置');
            return;
        }

        // 计算经纬度与高度
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        this.position = {
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            latitude: Cesium.Math.toDegrees(cartographic.latitude),
            altitude: cartographic.height,
            height: this.viewer.camera.positionCartographic.height / 1000, // 转换为千米
        };

        // 触发 Store 更新
        const action = STORE_ACTION_MAP[type];
        if (action) action(this.position);
    }
    handleCameraChanged(viewer: Cesium.Viewer) {
        const bounds = getViewBounds(viewer);
        // 此处还可以获取相机的方向参数，因此时不需要暂时不写，只获取相机在三维情况下的左上角和右下角的经纬度
        if (bounds) {
            const action = STORE_ACTION_MAP[EVENT_TYPES.CAMERA_CHANGED];
            if (action) action(bounds);
        }
    }
    /**
     * 销毁事件处理器（释放资源）
     */
    destroy() {
        if (this.handler) {
            this.handler.destroy();
            this.handler = null; // 避免内存泄漏
        }
    }
}
