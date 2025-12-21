import * as Cesium from 'cesium';
export class FleetManager {
    viewer: Cesium.Viewer;
    carrier: Cesium.Entity | null = null;
    units: Cesium.Entity[] = [];
    links: Cesium.Entity[] = [];

    constructor(viewer: Cesium.Viewer) {
        this.viewer = viewer;
    }

    /** 创建航母 */
    createCarrier(position: Cesium.Cartesian3) {
        this.carrier = this.viewer.entities.add({
            id: 'carrier',
            position,
            model: {
                uri: '/models/CesiumBalloon.glb',
                scale: 3
            },
            ellipse: this.createCircle(800, Cesium.Color.RED)
        });
    }

    /** 创建护卫舰 */
    createShip(id: string, position: Cesium.Cartesian3) {
        const ship = this.viewer.entities.add({
            id,
            position,
            model: {
                uri: '/models/CesiumMilkTruck.glb',
                scale: 3
            },
            ellipse: this.createCircle(500, Cesium.Color.BLUE)
        });

        this.units.push(ship);
        this.createLink(ship);
    }

    /** 创建飞机 */
    createPlane(id: string, position: Cesium.Cartesian3) {
        const plane = this.viewer.entities.add({
            id,
            position,
            model: {
                uri: '/models/Cesium_Air.glb',
                scale: 2
            },
        });

        // const radar = new RadarScan(
        //     this.viewer,
        //     plane,
        //     4000,
        //     1.0
        // );

        // plane.radar = radar;
        this.units.push(plane);
        this.createLink(plane);
    }

    /** 创建航母 ↔ 单位 连接线 */
    createLink(unit: Cesium.Entity) {
        const line = this.viewer.entities.add({
            polyline: {
                positions: new Cesium.CallbackProperty(() => {
                    const now = Cesium.JulianDate.now();
                    const p1 = this.carrier!.position?.getValue(now);
                    const p2 = unit.position!.getValue(now);
                    return p1 && p2 ? [p1, p2] : [];
                }, false),
                width: 2,
                material: Cesium.Color.LIME
            }
        });

        this.links.push(line);
    }

    /** 圆框统一生成 */
    createCircle(radius: number, color: Cesium.Color) {
        return {
            semiMajorAxis: radius,
            semiMinorAxis: radius,
            material: color.withAlpha(0.25),
            outline: true,
            outlineColor: color
        };
    }
}

class RadarScan {
    viewer: Cesium.Viewer;
    center: Cesium.Entity;
    radius: number;
    angle = 0;
    speed: number;
    entity: Cesium.Entity;

    constructor(
        viewer: Cesium.Viewer,
        center: Cesium.Entity,
        radius = 3000,
        speed = 1.2
    ) {
        this.viewer = viewer;
        this.center = center;
        this.radius = radius;
        this.speed = speed;

        this.entity = this.createEntity();
    }

    createEntity() {
        return this.viewer.entities.add({
            polygon: {
                hierarchy: new Cesium.CallbackProperty(() => {
                    return new Cesium.PolygonHierarchy(
                        this.computeSectorPositions()
                    );
                }, false),
                material: Cesium.Color.LIME.withAlpha(0.25)
            }
        });
    }

    computeSectorPositions(segments = 12, sectorAngle = 0.4) {
        const now = Cesium.JulianDate.now();
        const centerPos = this.center.position.getValue(now);
        if (!centerPos) return [];

        this.angle += this.speed * 0.016;

        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(centerPos);
        const positions = [];

        for (let i = 0; i <= segments; i++) {
            const a =
                this.angle - sectorAngle / 2 +
                (sectorAngle * i) / segments;

            const local = new Cesium.Cartesian3(
                Math.cos(a) * this.radius,
                Math.sin(a) * this.radius,
                0
            );

            positions.push(
                Cesium.Matrix4.multiplyByPoint(
                    enu,
                    local,
                    new Cesium.Cartesian3()
                )
            );
        }

        // 闭合回中心
        positions.unshift(centerPos);
        positions.push(centerPos);

        return positions;
    }
}