<template>
    <div id="cesiumContainer"></div>
    <div class="lnglat">
        经度:{{ lnglat.longitude }} &nbsp;纬度:{{ lnglat.latitude }}
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import * as Cesium from 'cesium';
import { useCesium } from '../../hooks/useCesium'
import { getCurrentPositionByMouse } from '../../utils/cesiumTools'
import { fragmentShader, GeometryPrimitive, makeTexture3D, vertexShader } from './tools';

let cesiumV: Cesium.Viewer;
const { getCesiumViewer } = useCesium({ container: 'cesiumContainer', infoBox: true })


onMounted(() => {
    cesiumV = getCesiumViewer()
    getLngLat()
    // mushRoom()
    mushRoomEffect()
})



//根据鼠标获取经纬度
const lnglat = reactive({
    longitude: 0,
    latitude: 0,
    height: 0
})
const getLngLat = () => {
    Cesium.BillboardCollection
    const handler = new Cesium.ScreenSpaceEventHandler(cesiumV.scene.canvas)

    handler.setInputAction((movement: any) => {
        const lnglathig = getCurrentPositionByMouse(cesiumV.scene, movement.endPosition, null)
        if (Cesium.defined(lnglathig)) {
            let carto = Cesium.Cartographic.fromCartesian(lnglathig);
            lnglat.latitude = Number(Cesium.Math.toDegrees(carto.latitude).toFixed(3));
            lnglat.longitude = Number(Cesium.Math.toDegrees(carto.longitude).toFixed(3));
            lnglat.height = Number(carto.height.toFixed(1));
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}


//蘑菇云爆炸效果
const mushRoom = () => {
    // ---------- 自定义 Fabric 材质（保留 InitBlastParams / Flow / SDF 结构） ----------
    const mushroomMaterial = new Cesium.Material({
        fabric: {
            type: 'ShadertoyMushroom',
            uniforms: {
                iTime: 0.0,
                iResolution: new Cesium.Cartesian2(1024.0, 1024.0),
                iChannel0: '/uniforms/iChannel0.png', // 请把纹理放在同目录，并命名为 iChannel0.png
                // 调整强度参数便于微调
                glowIntensity: 1.2,
                smokeStrength: 0.6
            },
            source: `

            float g_blastTime;
            vec3 g_cloudCentre;

            // Initialize common params (keep structure similar to original)
            void InitBlastParams(float iTimeLocal)
            {
                g_blastTime = fract(iTimeLocal/20.0);
                g_cloudCentre = vec3(0.0, g_blastTime*5.0, 0.0);
            }

            // Flow function adapted
            vec3 Flow( vec3 pos )
            {
                vec3 p = pos - g_cloudCentre;
                vec3 v;
                // make a toroidal roll, like a mushroom cloud
                // v.xz = -normalize(p.xz)*p.y;
                vec2 norm_xz = normalize(p.xz + 1e-5); // avoid division by zero
                v.xz = -norm_xz * p.y;
                v.y = length(p.xz) - 0.8;
                v *= 0.1;

                // reduce velocity with distance from cloud top edge
                float g = length(vec2(p.y, length(p.xz)-0.8)) - 1.0;
                v *= exp2(-pow(g*3.0, 2.0));

                return v;
            }

            // SDF-like density estimator using multi-scale texture sampling
            float SDF( vec3 pos )
            {
                // multi fractal
                const float period = 1.6;
                float tt = fract(iTime/period);
                float t0 = tt*period;
                float t1 = (tt-1.0)*period;

                vec3 uvw = (pos - g_cloudCentre) / 30.0;

                float f0 = 0.0;
                float f1 = 0.0;

                // two temporal layers (approximation of original)
                // sample the noise texture at multiple scales along uvw
                {
                    vec3 offset = Flow(pos) * t0 * 0.2;
                    vec2 u = uvw.xz * 2.0 + offset.xz;
                    f0 += texture(iChannel0, fract(u)).x * 0.5;
                    f0 += texture(iChannel0, fract(uvw.xz*4.0 + offset.xz)).x * 0.25;
                    f0 += texture(iChannel0, fract(uvw.xz*8.0 + offset.xz)).x * 0.125;
                    f0 += texture(iChannel0, fract(uvw.xz*16.0 + offset.xz)).x * 0.0625;
                }
                {
                    vec3 offset = Flow(pos) * t1 * 0.2;
                    vec2 u = uvw.xz * 2.0 + offset.xz;
                    f1 += texture(iChannel0, fract(u)).x * 0.5;
                    f1 += texture(iChannel0, fract(uvw.xz*4.0 + offset.xz)).x * 0.25;
                    f1 += texture(iChannel0, fract(uvw.xz*8.0 + offset.xz)).x * 0.125;
                    f1 += texture(iChannel0, fract(uvw.xz*16.0 + offset.xz)).x * 0.0625;
                }

                float ff = mix(f0, f1, tt);
                ff *= 0.5; // strength of clouds vs bounding shapes

                // bulging (expansion) based on g_blastTime
                vec3 p = pos - g_cloudCentre;
                float bulge = 1.0 - exp2(-20.0 * g_blastTime);
                float g = length(vec2(p.y, length(p.xz) - 1.0 * bulge)) - 1.0;
                ff *= bulge;

                // vertical column (approx)
                float h = length(pos.xz) - 0.7 + 0.2 * (g_cloudCentre.y - pos.y - 1.2);
                h = max(h, pos.y - g_cloudCentre.y);
                h = max(h, (g_cloudCentre.y*1.25 - 4.0 - pos.y) * 0.3);
                g = min(g, h);
                ff += g * 0.6;

                return ff;
            }

            // Main material entry
            czm_material czm_getMaterial(czm_materialInput materialInput)
            {
                czm_material material = czm_getDefaultMaterial(materialInput);

                // init
                InitBlastParams(iTime);

                // position in world space (materialInput.position is in model space if used with geometry transform)
                // But we will approximate using positionToEyeEC to march from eye into surface
                vec3 posEye = materialInput.positionToEyeEC; // vector from fragment to eye in eye coords
                // Convert to a local "object" space by using fragment position in model coordinates if available:
                // Cesium Fabric doesn't expose model-space position directly; we approximate volume inside [-0.5,0.5] box in object space using st coords.
                // We'll construct a local coord based on materialInput.st (0..1 over box faces) and normal
                vec2 st = materialInput.st;
                vec3 normal = normalize(materialInput.normalEC);

                // reconstruct a pseudo-local position inside box: center at origin, extents roughly [-1,1]
                // This is an approximation — good enough for surface-based volumetric impression.
                vec3 localPos = vec3((st - 0.5) * 2.0, 0.0);
                // nudge along normal so different faces have different depth
                localPos += normal * 0.5;

                // determine march direction: from eye into surface (in object-local approximation)
                vec3 rayDir = normalize(vec3(0.0, 0.0, -1.0)); // simple view-aligned march in local box space

                // Lighting accumulators
                float visibility = 1.0;
                vec3 accumColor = vec3(0.0);
                float accumAlpha = 0.0;

                // Fixed step count for performance — tuned to produce soft volumetric impression
                const int STEPS = 14;
                const float STEP_SIZE = 0.18; // sample spacing in local units

                // simulate a sun direction and secondary light (for dramatic effect)
                vec3 sunDir = normalize(vec3(1.0, 0.6, 0.2)); // warm light direction

                // March along ray in local box coordinates; sample SDF and compute emission
                vec3 marchPos = localPos - rayDir * 0.6; // start slightly inside
                for (int i = 0; i < STEPS; i++)
                {
                    float d = SDF(marchPos);

                    // density from SDF (smaller d -> denser)
                    // remap d to density: use smoothstep to create soft edges
                    float softness = 0.18 + pow(g_blastTime, 2.0) * 0.45;
                    float density = smoothstep(0.6, -0.3, d) * smokeStrength; // smokeStrength uniform
                    density = clamp(density, 0.0, 1.0);

                    // emission: mix between fiery core and smoke based on density and time
                    // fiery color — strong when closer to center and for early blastTime
                    float coreFactor = smoothstep(0.9, 0.2, abs(d*0.8)) * (1.0 - pow(g_blastTime, 0.8));
                    vec3 fire = vec3(1.0, 0.45, 0.08) * pow(coreFactor, 1.0) * (1.0 + 3.0 * (1.0 - g_blastTime));
                    // smoke color from texture sampling for structure
                    vec2 texUV = fract(marchPos.xz * 0.6 + vec2(iTime * 0.15, -iTime * 0.1));
                    float texVal = texture(iChannel0, texUV).x;
                    vec3 smoke = vec3(0.15, 0.12, 0.08) * texVal * 2.0;

                    // combined emission
                    vec3 emission = mix(smoke, fire, coreFactor) * density * glowIntensity;

                    // simple lighting: brighten emission facing sun
                    float NdotL = clamp(dot(normalize(marchPos), sunDir) * 0.5 + 0.5, 0.0, 1.0);
                    emission *= 0.6 + 0.8 * NdotL;

                    // accumulate with alpha compositing (front-to-back)
                    float alphaStep = density * 0.18; // how much this step contributes
                    alphaStep = clamp(alphaStep, 0.0, 0.9);
                    accumColor += (1.0 - accumAlpha) * emission * alphaStep;
                    accumAlpha += (1.0 - accumAlpha) * alphaStep;

                    visibility *= exp2(-d * 0.2); // reduce visibility based on local sdf (approx)

                    // advance march position
                    marchPos += rayDir * STEP_SIZE;
                }

                // base sky / ambient contribution
                vec3 sky = vec3(0.08, 0.16, 0.28) + vec3(0.6, 0.45, 0.3) * pow(1.0 - g_blastTime, 1.5) * 0.12;
                vec3 finalColor = mix(sky, accumColor + vec3(0.02), accumAlpha);

                // apply gamma-ish tone mapping for more dramatic contrast
                finalColor = pow(finalColor, vec3(0.9));

                material.diffuse = finalColor;
                material.emission = accumColor * 0.9;
                material.alpha = clamp(accumAlpha + 0.2 * (1.0 - g_blastTime), 0.0, 1.0);

                return material;
            }
        `
        }
    });

    // ---------- 创建 Box Geometry 与 Primitive ----------
    // Box center (lon, lat, height) — 你可以改为任意位置
    const lon = 116.391; // 经度
    const lat = 39.9;    // 纬度
    const height = 25; // 高度（米）

    // Box 尺寸（米）
    const size = new Cesium.Cartesian3(20000.0, 20000.0, 20000.0);

    const boxGeometry = Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.VertexFormat.POSITION_NORMAL_AND_ST,
        dimensions: size
    });

    const center = Cesium.Cartesian3.fromDegrees(lon, lat, height);
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);

    const geomInstance = new Cesium.GeometryInstance({
        geometry: boxGeometry,
        modelMatrix: modelMatrix,
        id: 'mushroomBox'
    });

    const primitive = new Cesium.Primitive({
        geometryInstances: geomInstance,
        appearance: new Cesium.MaterialAppearance({
            material: mushroomMaterial,
            translucent: true,
            // faceForward: true
        }),
        asynchronous: false
    });

    cesiumV.scene.primitives.add(primitive);

    // 定位相机
    // cesiumV.camera.flyTo({
    //     destination: Cesium.Cartesian3.fromDegrees(lon, lat, height + 700000.0),
    //     orientation: {
    //         heading: Cesium.Math.toRadians(0.0),
    //         pitch: Cesium.Math.toRadians(-0.6),
    //         roll: 0.0
    //     },
    //     duration: 2.0
    // });

    // ---------- 动态更新时间（iTime） ----------
    cesiumV.scene.preRender.addEventListener(function (scene, time) {
        const t = performance.now() * 0.001;
        mushroomMaterial.uniforms.iTime = t;
        mushroomMaterial.uniforms.iResolution = new Cesium.Cartesian2(cesiumV.canvas.width, cesiumV.canvas.height);
        // 可在这里动态修改 glowIntensity / smokeStrength 如果需要控制 UI
    });

}


//蘑菇云效果2
const mushRoomEffect = () => {
    const texture3D = makeTexture3D(cesiumV.scene.context);
    texture3D.generateMipmap();
    // console.log(texture3D);

    const boxSideLength = 1.0;
    const zoomScale = 1000000;
    const centerPoint = Cesium.Cartesian3.fromDegrees(
        113,
        33,
        500000,
    );

    let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(centerPoint);
    const zoomMat = Cesium.Matrix4.fromScale(
        new Cesium.Cartesian3(zoomScale, zoomScale, zoomScale),
        new Cesium.Matrix4(),
    );
    Cesium.Matrix4.multiply(modelMatrix, zoomMat, modelMatrix);

    // create box geometry (same as you had)
    const halfBox = Cesium.Cartesian3.multiplyByScalar(
        new Cesium.Cartesian3(boxSideLength, boxSideLength, boxSideLength),
        0.5,
        new Cesium.Cartesian3(),
    );
    const negHalfBox = Cesium.Cartesian3.negate(halfBox, new Cesium.Cartesian3());
    const boxGeometry = new Cesium.BoxGeometry({
        minimum: negHalfBox,
        maximum: halfBox,
    });

    // uniforms object
    const uniforms = {
        base: new Cesium.Color(0.9912, 0.8542, 0.3515, 0),
        map: texture3D,
        opacity: 0.25,
        range: 0.1,
        steps: 100.0,
        frame: 0.0,
        threshold: 0.25,
        u_time: 0.0,
        u_inverseModel: new Cesium.Matrix4(),
        czm_cameraPositionWC: cesiumV.camera.positionWC
    };

    // window.uniforms = uniforms;

    // helper to return uniform values for DrawCommand
    const cmdUniforms: any = {};
    for (const key in uniforms) {
        if (Object.prototype.hasOwnProperty.call(uniforms, key)) {
            cmdUniforms[key] = function () {
                return uniforms[key];
            };
        }
    }

    const renderState = Cesium.RenderState.fromCache({
        depthMask: false,
        blending: {
            enabled: true,
            color: { red: 0, green: 0, blue: 0, alpha: 0 },
        },
        depthTest: { enabled: true, func: Cesium.DepthFunction.LESS_OR_EQUAL },
        cull: { enabled: true, face: Cesium.CullFace.BACK }, // back-face culling
    });

    const primitive = new GeometryPrimitive(boxGeometry, {
        uniformMap: cmdUniforms,
        vertexShaderSource: vertexShader,
        fragmentShaderSource: fragmentShader,
        renderState: renderState,
        modelMatrix,
        pass: Cesium.Pass.TRANSLUCENT,
    });


    cesiumV.scene.primitives.add(primitive);

    function updateInverseModelMatrix() {
        const inv = Cesium.Matrix4.inverse(modelMatrix, new Cesium.Matrix4());
        uniforms.u_inverseModel = inv;
    }

    let frameCount = 0;
    cesiumV.scene.preRender.addEventListener(function (scene, time) {
        frameCount++;

        uniforms.frame = frameCount;
        // use seconds since epoch (or viewer.clock) - here use scene.time.secondsOfDay for smoother animation
        // fallback to Date.now() when scene.time is not reliable
        const seconds = cesiumV.clock ? Cesium.JulianDate.toDate(cesiumV.clock.currentTime).getTime() / 1000.0 : Date.now() / 1000.0;
        uniforms.u_time = seconds;
        updateInverseModelMatrix();
    });

    cesiumV.camera.flyTo({
        destination: centerPoint
    })
}


</script>

<style scoped>
#cesiumContainer {
    height: 100vh;
}

.lnglat {
    position: absolute;
    top: 2%;
    left: 3%;
    width: 300px;
    height: 40px;
    text-align: center;
    line-height: 40px;
    font-size: 16px;
    border-radius: 3px;
    background-color: beige;
}
</style>