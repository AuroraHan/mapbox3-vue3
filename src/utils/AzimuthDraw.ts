//方向角绘制
import * as Cesium from "cesium";
import DrawBase from "@/utils/drawBase";

export interface AzimuthData {
    id: string;
    origin: Cesium.Cartesian3;
    target: Cesium.Cartesian3;
    azimuth: number;
    northLine: Cesium.Entity;
    azimuthLine: Cesium.Entity;
    label: Cesium.Entity;
}

export class AzimuthDrawLow extends DrawBase {
    // 当前绘制
    private origin: Cesium.Cartesian3 | null = null;
    private data: AzimuthData | null = null;

    // 结果管理
    azimuthMap = new Map<string, AzimuthData>();

    constructor(viewer: Cesium.Viewer) {
        super(viewer);
    }

    /** 左键 */
    onLeftClick(ev: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
        if (!this.isDraw) return;

        const pos = this.pickPosition(ev.position);
        if (!pos) return;

        if (!this.origin) {
            this.origin = pos;
            this.createEntities();
        }
    }

    /** 鼠标移动 */
    onMouseMove(ev: Cesium.ScreenSpaceEventHandler.MotionEvent) {
        if (!this.origin || !this.data) return;

        const pos = this.pickPosition(ev.endPosition);
        if (!pos) return;

        this.updateAzimuth(pos);
    }

    /** 右键结束 */
    onRightClick(_: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
        if (!this.data) return;

        this.azimuthMap.set(this.data.id, this.data);
        this.reset();
    }

    /** 创建实体 */
    private createEntities() {
        const id = Cesium.createGuid();

        // ① 北向参考线
        const northEnd = this.computeNorthPoint(this.origin!);

        const northLine = this.viewer.entities.add({
            polyline: {
                positions: [this.origin!, northEnd],
                width: 2,
                material: new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.CYAN.withAlpha(0.8),
                    dashLength: 12,
                }),
                clampToGround: true,
            },
        });

        // ② 方位角线（动态）
        const azimuthPositions = new Cesium.CallbackProperty(() => {
            return this.data
                ? [this.origin!, this.data.target]
                : [];
        }, false);

        const azimuthLine = this.viewer.entities.add({
            polyline: {
                positions: azimuthPositions,
                width: 3,
                material: Cesium.Color.YELLOW,
                clampToGround: true,
            },
        });

        // ③ 角度文字
        const label = this.viewer.entities.add({
            position: this.origin!,
            label: {
                text: new Cesium.CallbackProperty(() => {
                    return this.data
                        ? `方位角 ${this.data.azimuth.toFixed(1)}°`
                        : '';
                }, false),
                font: '16px sans-serif',
                fillColor: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -12),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
        });

        this.data = {
            id,
            origin: this.origin!,
            target: this.origin!,
            azimuth: 0,
            northLine,
            azimuthLine,
            label,
        };
    }

    /** 更新方位角 */
    private updateAzimuth(target: Cesium.Cartesian3) {
        this.data!.target = target;
        this.data!.azimuth = this.computeAzimuth(
            this.origin!,
            target
        );
    }

    /** 北为0° 顺时针 */
    private computeAzimuth(
        origin: Cesium.Cartesian3,
        target: Cesium.Cartesian3
    ) {
        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
        const inv = Cesium.Matrix4.inverse(enu, new Cesium.Matrix4());

        const local = Cesium.Matrix4.multiplyByPoint(
            inv,
            target,
            new Cesium.Cartesian3()
        );

        let rad = Math.atan2(local.x, local.y);
        if (rad < 0) rad += Cesium.Math.TWO_PI;

        return Cesium.Math.toDegrees(rad);
    }

    /** 正北参考点 */
    private computeNorthPoint(
        origin: Cesium.Cartesian3,
        length = 1000
    ) {
        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
        const northLocal = new Cesium.Cartesian3(0, length, 0);

        return Cesium.Matrix4.multiplyByPoint(
            enu,
            northLocal,
            new Cesium.Cartesian3()
        );
    }

    /** 重置 */
    private reset() {
        this.origin = null;
        this.data = null;
        this.offListener();
    }

    /** 拾取地表点 */
    private pickPosition(pos: Cesium.Cartesian2) {
        const ray = this.viewer.camera.getPickRay(pos);
        if (!ray) return null;
        return this.viewer.scene.globe.pick(ray, this.viewer.scene);
    }
}

export class AzimuthDraw extends DrawBase {
    private origin: Cesium.Cartesian3 | null = null;
    private target: Cesium.Cartesian3 | null = null;

    // 当前唯一方向角实体
    private northLine?: Cesium.Entity;
    private dynamicLine?: Cesium.Entity;
    private endLine?: Cesium.Entity;
    private label?: Cesium.Entity;

    constructor(viewer: Cesium.Viewer) {
        super(viewer);
    }

    //开启绘制
    openDraw() {
        this.clearEntities();
        this.onListener();
    }

    /** 左键：设置起点 */
    onLeftClick(ev: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
        if (!this.isDraw) return;

        const pos = this.pickPosition(ev.position);
        if (!pos) return;

        if (!this.origin) {
            this.origin = pos;
            this.createEntities();
        }
    }

    /** 鼠标移动：动态更新方向 */
    onMouseMove(ev: Cesium.ScreenSpaceEventHandler.MotionEvent) {
        if (!this.origin || !this.dynamicLine) return;

        const pos = this.pickPosition(ev.endPosition);
        if (!pos) return;

        this.target = pos;
        this.updateDynamicLine(pos);
    }

    /** 右键：结束并标记结束线 */
    onRightClick(_: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
        if (!this.origin || !this.target) {
            this.reset();
            return;
        }

        this.finish();
    }

    // ================= 内部方法 =================

    /** 创建北向线 + 动态线 + Label */
    private createEntities() {
        // 北向参考线
        const northEnd = this.computeNorthPoint(this.origin!);
        this.northLine = this.viewer.entities.add({
            polyline: {
                positions: [this.origin!, northEnd],
                width: 2,
                material: new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.CYAN.withAlpha(0.8),
                    dashLength: 12,
                }),
                clampToGround: true,
            },
        });

        // 动态方向线
        const positions = new Cesium.CallbackProperty(() => {
            return this.target
                ? [this.origin!, this.target]
                : [this.origin!, this.origin!];
        }, false);

        this.dynamicLine = this.viewer.entities.add({
            polyline: {
                positions,
                width: 3,
                material: Cesium.Color.YELLOW,
                clampToGround: true,
            },
        });

        // 角度文字
        this.label = this.viewer.entities.add({
            position: this.origin!,
            label: {
                text: new Cesium.CallbackProperty(() => {
                    if (!this.target) return '';
                    const az = this.computeAzimuth(
                        this.origin!,
                        this.target
                    );
                    return `方向角 ${az.toFixed(1)}°`;
                }, false),
                font: '16px sans-serif',
                fillColor: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -12),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
        });
    }

    /** 动态更新 */
    private updateDynamicLine(target: Cesium.Cartesian3) {
        this.target = target;
    }

    /** 完成：固化结束线 */
    private finish() {
        // 删除动态线
        if (this.dynamicLine) {
            this.viewer.entities.remove(this.dynamicLine);
            this.dynamicLine = undefined;
        }

        // 生成结束线
        this.endLine = this.viewer.entities.add({
            polyline: {
                positions: [this.origin!, this.target!],
                width: 3,
                material: Cesium.Color.ORANGE,
                clampToGround: true,
            },
        });

        this.offListener();
    }

    /** 正北方向点 */
    private computeNorthPoint(
        origin: Cesium.Cartesian3,
        length = 1000
    ) {
        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
        return Cesium.Matrix4.multiplyByPoint(
            enu,
            new Cesium.Cartesian3(0, length, 0),
            new Cesium.Cartesian3()
        );
    }

    /** 北为0° 顺时针 */
    private computeAzimuth(
        origin: Cesium.Cartesian3,
        target: Cesium.Cartesian3
    ) {
        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
        const inv = Cesium.Matrix4.inverse(enu, new Cesium.Matrix4());

        const local = Cesium.Matrix4.multiplyByPoint(
            inv,
            target,
            new Cesium.Cartesian3()
        );

        let rad = Math.atan2(local.x, local.y);
        if (rad < 0) rad += Cesium.Math.TWO_PI;

        return Cesium.Math.toDegrees(rad);
    }

    /** 删除所有实体（只保留一个方向角） */
    private clearEntities() {
        [
            this.northLine,
            this.dynamicLine,
            this.endLine,
            this.label,
        ].forEach((e) => {
            if (e) this.viewer.entities.remove(e);
        });

        this.northLine = undefined;
        this.dynamicLine = undefined;
        this.endLine = undefined;
        this.label = undefined;
        this.origin = null;
        this.target = null;
    }

    private reset() {
        this.clearEntities();
        this.offListener();
    }

    private pickPosition(pos: Cesium.Cartesian2) {
        const ray = this.viewer.camera.getPickRay(pos);
        if (!ray) return null;
        return this.viewer.scene.globe.pick(ray, this.viewer.scene);
    }
}