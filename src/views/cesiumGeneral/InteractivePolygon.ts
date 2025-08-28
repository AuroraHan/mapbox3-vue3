import * as Turf from '@turf/turf'
import * as Cesium from 'cesium';
import { ElMessage } from 'element-plus';
import { convertCartesiansToDegrees, ensurePolygonClosed, formatAreaText } from './customUtils';

// 常量配置
const TEMP_POLYGON_COLOR = Cesium.Color.BLUE.withAlpha(0.3);
const FINAL_POLYGON_COLOR = Cesium.Color.RED.withAlpha(0.2);
const MIN_VERTEX_COUNT = 3;

export class InteractivePolygon {
    viewer: Cesium.Viewer;
    polygon: null | Cesium.Entity;
    dynamicPoints: any[];
    polygonPoints: any[];
    entityList: any[];
    isDrawing: boolean;
    constructor(viewer: Cesium.Viewer) {
        this.viewer = viewer;
        this.polygon = null;
        this.dynamicPoints = [];
        this.polygonPoints = [];
        this.entityList = [];
        this.isDrawing = false;
        this._initPolygon();
    }
    _initPolygon() {
        if (this.polygon) {
            this.viewer.entities.remove(this.polygon);
        }
        this.polygon = this.viewer.entities.add({
            polygon: {
                hierarchy: new Cesium.CallbackProperty(
                    () => new Cesium.PolygonHierarchy(this.dynamicPoints),
                    false
                ),
                material: TEMP_POLYGON_COLOR, // 绘制过程中使用红色
            },
        });
        this.isDrawing = true;
    }

    leftClickPosition(position: Cesium.Cartographic) {
        const cartesian = Cesium.Cartesian3.fromDegrees(position.longitude, position.latitude);
        debugger
        if (!cartesian) return;
        this.polygonPoints.push(cartesian);
        this.dynamicPoints.push(cartesian);
    }
    mouseMovePosition(position: Cesium.Cartographic) {
        if (this.polygonPoints.length === 0 || !this.isDrawing) return;
        const cartesian = Cesium.Cartesian3.fromDegrees(position.longitude, position.latitude);
        if (!cartesian) return;
        // 更新动态点
        if (this.dynamicPoints.length > this.polygonPoints.length) this.dynamicPoints.pop();

        this.dynamicPoints.push(cartesian);
    }
    rightClickPosition() {
        if (this.polygonPoints.length < MIN_VERTEX_COUNT) {
            ElMessage.error(`至少需要${MIN_VERTEX_COUNT}个顶点才能形成多边形`);
            this.clearDrawing();
            return;
        }
        this.dynamicPoints.pop();
        this.isDrawing = false;
        this._saveFinalPolygon();
    }
    _saveFinalPolygon() {
        this.viewer.entities.remove(this.polygon!);
        this.polygon = this.viewer.entities.add({
            polygon: {
                hierarchy: new Cesium.PolygonHierarchy(this.polygonPoints),
                material: FINAL_POLYGON_COLOR,
            },
        });
        this.entityList.push(this.polygon);
        this._calculateAndShowArea();
    }
    clearDrawing() {
        this.isDrawing = false;
        this.polygonPoints = [];
        this.dynamicPoints = [];
        if (this.entityList.length > 0) {
            this.entityList.forEach((item) => {
                this.viewer.entities.remove(item);
            });
        }
        this.polygon = null;
        this.entityList = [];
    }

    _calculateAndShowArea() {
        try {
            // 校验顶点数量
            if (this.polygonPoints.length < MIN_VERTEX_COUNT) {
                ElMessage.error("至少需要3个顶点才能计算面积");
                return;
            }
            // 步骤1：转换为经纬度数组（带有效性校验）
            // const aa = Cesium.Cartographic.fromCartesian(this.polygonPoints[3])
            // console.log(aa, 'kkk');
            const degreesCoordinates = convertCartesiansToDegrees(this.polygonPoints);
            if (!degreesCoordinates) {
                ElMessage.error("存在无效坐标点，无法计算面积");
                return;
            }
            // 步骤2：确保多边形闭合（处理浮点精度问题）
            const closedCoordinates = ensurePolygonClosed(degreesCoordinates);
            // 步骤3：使用Turf.js计算面积（带格式校验）
            const areaResult = this._calculateAreaWithTurf(closedCoordinates);
            if (!areaResult) {
                ElMessage.error("面积计算失败，请检查多边形有效性");
                return;
            }
            // 步骤4：自适应单位显示（平方公里/公顷）
            const areaText = formatAreaText(areaResult.squareMeters);
            console.log("计算面积:", areaText);
        } catch (error) {
            console.error("面积计算异常:", error);
            ElMessage.error("面积计算异常，请检查控制台日志");
        }
    }

    _calculateAreaWithTurf(closedCoordinates: any) {
        try {
            // Turf要求多边形坐标是[[[lng,lat],...]]格式
            const turfPolygon = Turf.polygon([closedCoordinates]);
            return {
                squareMeters: Turf.area(turfPolygon),
                // 可选：添加其他Turf返回的信息（如周长）
                perimeter: Turf.length(turfPolygon),
            };
        } catch (turfError) {
            console.error("Turf计算异常:", turfError);
            return null;
        }
    }

}