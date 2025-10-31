import {
  Cartesian3,
  destroyObject,
  DrawCommand,
  VertexArray,
  GeometryPipeline,
  Matrix4,
} from 'cesium';

import Texture3D from '@cesium/engine/Source/Renderer/Texture3D'
import Sampler from '@cesium/engine/Source/Renderer/Sampler'

import * as Cesium from 'cesium';

/**
 *
 * @param minLon
 * @param maxLon
 * @param minLat
 * @param maxLat
 * @param num
 * @returns
 */
export const randomGeoJsonPoint = (
  minLon: number,
  maxLon: number,
  minLat: number,
  maxLat: number,
  num: number
) => {
  let points = {
    type: "FeatureCollection",
    features: [],
  } as GeoJSON.FeatureCollection<GeoJSON.Point>;
  for (let i = 0; i < num; i++) {
    let point = {
      type: "Feature",
      properties: {
        value: Number(Math.random() * 100).toFixed(1),
        name: "mack" + (Math.random() * num).toFixed(0),
      },
      geometry: {
        type: "Point",
        coordinates: [
          Math.random() * (maxLon - minLon) + minLon,
          Math.random() * (maxLat - minLat) + minLat,
        ],
      },
    } as GeoJSON.Feature<GeoJSON.Point>;
    points.features.push(point);
  }
  return points;
};

/**
 * Custom Primitive for Geometry
 */
export class GeometryPrimitive {
  options: any;
  geometry: any;
  _boundingSphereWC: any[];
  /**
   *
   * @param {*} options
   * @param {*} options.modelMatrix
   * @param {*} options.vertexShaderSource
   * @param {*} options.fragmentShaderSource
   * @param {*} options.uniformMap
   * @param {*} options.renderState
   * @param {*} options.pass
   */
  constructor(geometry, options) {
    this.options = options;
    this.geometry = geometry;
  }

  /**
   *
   * @param {*} frameState
   */
  update(frameState: any) {
    if (Cesium.defined(this._drawCommand)) {
      frameState.commandList.push(this._drawCommand);
      return;
    }
    if (this.geometry.constructor.createGeometry) {
      this.geometry = this.geometry.constructor.createGeometry(this.geometry);
    }

    const context = frameState.context;

    const attributeLocations = GeometryPipeline.createAttributeLocations(
      this.geometry,
    );
    const vertexArray = VertexArray.fromGeometry({
      context: context,
      geometry: this.geometry,
      attributeLocations,
    });

    // calculate boundingSphere
    const boundingSphere = this.geometry.boundingSphere;
    boundingSphere.center = Matrix4.multiplyByPoint(
      this.options.modelMatrix,
      boundingSphere.center,
      new Cartesian3(),
    );
    boundingSphere.radius = 1000000;

    this._boundingSphereWC = [boundingSphere];

    const shaderProgram = Cesium.ShaderProgram.fromCache({
      context: context,
      attributeLocations,
      vertexShaderSource: this.options.vertexShaderSource,
      fragmentShaderSource: this.options.fragmentShaderSource,
    });

    this._drawCommand = new DrawCommand({
      owner: this,
      boundingVolume: boundingSphere,
      primitiveType: this.geometry.primitiveType,
      vertexArray: vertexArray,
      shaderProgram,
      ...this.options,
    });
  }

  destroy() {
    return destroyObject(this);
  }

  isDestroyed() {
    return false;
  }
}
// GeometryPrimitive end

export function makeTexture3D(context: any) {

  const size = 100;
  const dataLength = size * size * size;
  const data = new Uint8Array(dataLength);
  let i = 0;
  const scale = 0.05;
  const perlin = new ImprovedNoise();
  let vector = new Cesium.Cartesian3();
  const halfSize = Cesium.Cartesian3.fromElements(
    size / 2,
    size / 2,
    size / 2,
    new Cesium.Cartesian3(),
  );

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        vector = Cesium.Cartesian3.fromElements(x, y, z, vector);
        vector = Cesium.Cartesian3.subtract(vector, halfSize, vector);
        vector = Cesium.Cartesian3.divideByScalar(vector, size, vector);

        const d = 1.0 - Cesium.Cartesian3.magnitude(vector);
        const tv =
          (128 +
            128 * perlin.noise((x * scale) / 1.5, y * scale, (z * scale) / 1.5)) *
          d *
          d;

        data[i] = tv;
        i++;
      }
    }
  }

  return new Texture3D({
    context: context,
    width: size,
    height: size,
    depth: size,
    flipY: false,
    pixelFormat: Cesium.PixelFormat.RED,
    pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
    source: {
      arrayBufferView: data,
      width: size,
      height: size,
      depth: size,
    },
    sampler: new Sampler({
      minificationFilter: Cesium.TextureMinificationFilter.LINEAR,
      magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR,
    }),
  });
}


const lerp = Cesium.Math.lerp;

const _p = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36,
  103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0,
  26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56,
  87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
  77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55,
  46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132,
  187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109,
  198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126,
  255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183,
  170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172,
  9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
  218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81,
  51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84,
  204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67,
  29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];


function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y,
    v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}


class ImprovedNoise {
  constructor() {
    for (let i = 0; i < 256; i++) {
      _p[256 + i] = _p[i];
    }
  }
  /**
   * Returns a noise value for the given parameters.
   *
   * @param {number} x - The x coordinate.
   * @param {number} y - The y coordinate.
   * @param {number} z - The z coordinate.
   * @return {number} The noise value.
   */
  noise(x, y, z) {
    const floorX = Math.floor(x),
      floorY = Math.floor(y),
      floorZ = Math.floor(z);

    const X = floorX & 255,
      Y = floorY & 255,
      Z = floorZ & 255;

    x -= floorX;
    y -= floorY;
    z -= floorZ;

    const xMinus1 = x - 1,
      yMinus1 = y - 1,
      zMinus1 = z - 1;

    const u = fade(x),
      v = fade(y),
      w = fade(z);

    const A = _p[X] + Y,
      AA = _p[A] + Z,
      AB = _p[A + 1] + Z,
      B = _p[X + 1] + Y,
      BA = _p[B] + Z,
      BB = _p[B + 1] + Z;

    return lerp(
      lerp(
        lerp(grad(_p[AA], x, y, z), grad(_p[BA], xMinus1, y, z), u),
        lerp(grad(_p[AB], x, yMinus1, z), grad(_p[BB], xMinus1, yMinus1, z), u),
        v,
      ),
      lerp(
        lerp(
          grad(_p[AA + 1], x, y, zMinus1),
          grad(_p[BA + 1], xMinus1, y, zMinus1),
          u,
        ),
        lerp(
          grad(_p[AB + 1], x, yMinus1, zMinus1),
          grad(_p[BB + 1], xMinus1, yMinus1, zMinus1),
          u,
        ),
        v,
      ),
      w,
    );
  }
}

export const vertexShader = `
    in vec3 position3DHigh;
    in vec3 position3DLow;
    in vec3 normal;
    in vec2 st;
    in float batchId;

    out vec3 vPositionWC; // world-space position for fragment shader

    vec4 translateRelativeToEye(vec3 high, vec3 low) {
        vec3 highDifference = high - czm_encodedCameraPositionMCHigh;
        if(length(highDifference) == 0.0) {
            highDifference = vec3(0);
        }
        vec3 lowDifference = low - czm_encodedCameraPositionMCLow;
        return vec4(highDifference + lowDifference, 1.0);
    }

    void main()
    {
        // get model-space vertex (position3DHigh + position3DLow) in world coordinates
        vec3 modelPosition = position3DHigh + position3DLow;
        // compute world position using czm_model (modelMatrix)
        vec4 worldPos = czm_model * vec4(modelPosition, 1.0);
        vPositionWC = worldPos.xyz;

        // do the usual relative-to-eye translate for gl_Position
        vec4 p = translateRelativeToEye(position3DHigh, position3DLow);
        gl_Position = czm_modelViewProjectionRelativeToEye * p;
    }
  `;

// ---------------------- 片元着色器 ----------------------
export const fragmentShader = `
    #version 300 es
    precision highp float;
    precision highp sampler3D;

    in vec3 vPositionWC;

    //out vec4 out_FragColor;

    uniform sampler3D map;
    uniform vec3 base;
    uniform float threshold;
    uniform float range;
    uniform float opacity;
    uniform float steps;
    uniform float frame;
    uniform float u_time;
    uniform vec3 czm_cameraPositionWC;

    uniform mat4 u_inverseModel;

    float g_blastTime;
    vec3 g_cloudCentre;

    void InitBlastParams() {
        g_blastTime = fract(u_time / 20.0);
        g_cloudCentre = vec3(0.0, g_blastTime * 5.0, 0.0);
    }

    vec3 Flow(vec3 pos) {
        vec3 p = pos - g_cloudCentre;
        vec3 v;
        vec2 xz = p.xz;
        float lenxz = length(xz);
        vec2 dir_xz = (lenxz > 0.0) ? (-xz / lenxz) : vec2(0.0);
        v.xz = dir_xz * p.y * -1.0;
        v.y = length(xz) - 0.8;
        v *= 0.1;
        float g = length(vec2(p.y, length(p.xz) - 0.8)) - 1.0;
        v *= exp2(-pow(g * 3.0, 2.0));
        return v;
    }

    float sampleNoise(vec3 coord) {
        return texture(map, coord).r;
    }

    float SDF(vec3 pos) {
        const float period = 1.6;
        float tt = fract(u_time / period);
        float t0 = tt * period;
        float t1 = (tt - 1.0) * period;

        vec3 uvw = (pos - g_cloudCentre) / 0.30; // tuned scaling (was /30 in shadertoy)
        float f0 = 0.0;
        float f1 = 0.0;


        for (int i = 0; i < 2; i++) {
            float ti = (i==0) ? t0 : t1;
            vec3 offset = Flow(pos) * ti * 0.2;
            vec3 u = uvw + offset;

            vec3 c2 = 0.5 + u * 0.02;  
            vec3 c4 = 0.5 + u * 0.04;
            vec3 c8 = 0.5 + u * 0.08;
            vec3 c16 = 0.5 + u * 0.16;
            vec3 c32 = 0.5 + u * 0.32;


            f0 += sampleNoise(c2) * 0.5;
            f0 += sampleNoise(c4) * 0.25;
            f0 += sampleNoise(c8) * 0.125;
            f0 += sampleNoise(c16) * 0.0625;
            f0 += sampleNoise(c32) * 0.03125;


            f1 += sampleNoise(c2 + offset * 0.0) * 0.5;
            f1 += sampleNoise(c4 + offset * 0.0) * 0.25;
            f1 += sampleNoise(c8 + offset * 0.0) * 0.125;
            f1 += sampleNoise(c16 + offset * 0.0) * 0.0625;
            f1 += sampleNoise(c32 + offset * 0.0) * 0.03125;
        }

        float ff = mix(f0, f1, tt);
        ff *= 0.5; 

        vec3 p = pos - g_cloudCentre;
        float bulge = 1.0 - exp2(-20.0 * g_blastTime);
        float g = length(vec2(p.y, length(p.xz) - 1.0 * bulge)) - 1.0;
        ff *= bulge;

        float h = length(pos.xz) - 0.7 + 0.2 * (g_cloudCentre.y - pos.y - 1.2);
        h = max(h, pos.y - g_cloudCentre.y);
        h = max(h, (g_cloudCentre.y * 1.25 - 4.0 - pos.y) * 0.3);

        g = min(g, h);
        ff += g * 0.6;

        return ff;
    }


    float shading(vec3 coord) {
        float step = 0.01;
        return sampleNoise(coord - vec3(step)) - sampleNoise(coord + vec3(step));
    }


    vec2 hitBox(vec3 orig, vec3 dir) {
        vec3 box_min = vec3(-0.5);
        vec3 box_max = vec3(0.5);
        vec3 inv_dir = 1.0 / dir;
        vec3 tmin_tmp = (box_min - orig) * inv_dir;
        vec3 tmax_tmp = (box_max - orig) * inv_dir;
        vec3 tmin = min(tmin_tmp, tmax_tmp);
        vec3 tmax = max(tmin_tmp, tmax_tmp);
        float t0 = max(tmin.x, max(tmin.y, tmin.z));
        float t1 = min(tmax.x, min(tmax.y, tmax.z));
        return vec2(t0, t1);
    }

    uint wang_hash(uint s)
    {
            s = (s ^ 61u) ^ (s >> 16u);
            s *= 9u;
            s = s ^ (s >> 4u);
            s *= 0x27d4eb2du;
            s = s ^ (s >> 15u);
            return s;
    }

    float randomFloat(inout uint s) {
        return float(wang_hash(s)) / 4294967296.0;
    }

    void main() {
        vec3 camWC = czm_cameraPositionWC;
        vec3 camModel = (u_inverseModel * vec4(camWC, 1.0)).xyz;
        vec3 posModel = (u_inverseModel * vec4(vPositionWC, 1.0)).xyz;

        vec3 dir = normalize(posModel - camModel);

        InitBlastParams();


        vec2 bounds = hitBox(camModel, dir);
        if (bounds.x > bounds.y) {
            discard;
        }
        bounds.x = max(bounds.x, 0.0);
        vec3 p = camModel + bounds.x * dir; 

        vec3 absDir = abs(dir);
        float delta = min(absDir.x, min(absDir.y, absDir.z));
        delta = delta / steps; 

        uint seed = uint(gl_FragCoord.x) * 1973u + uint(gl_FragCoord.y) * 9277u + uint(frame) * 26699u;
        
        
        float randNum = randomFloat(seed) * 2.0 - 1.0;
        vec3 size = vec3(textureSize(map, 0));
        p += dir * randNum * (1.0 / max(size.x, 1.0));


        vec4 ac = vec4(base, 0.0);
        float visibility = 1.0;
        float light0 = 0.0;
        float light1 = 0.0;
        vec3 sunDir = normalize(vec3(1.0, 0.8, 0.5)); 
        for (float t = bounds.x; t < bounds.y; t += delta) {
            vec3 sampleP = p; 

            vec3 texCoord = sampleP + vec3(0.5);

            float h = SDF(sampleP);

            float softness = 0.1 + pow(g_blastTime, 2.0) * 0.5;
            float density = 1.2 / softness;
            const float epsilon = 0.001;
            float vis = smoothstep(epsilon, softness, h);
            if (sampleP.y < 0.0) vis = 1.0; 

            h = max(h, epsilon);
            if (vis < 1.0) {
                float newvis = visibility * pow(vis, h * density);
              
                float sc = smoothstep(-0.5, 1.0, (SDF(sampleP + sunDir * softness) - h) / softness);
                light0 += (visibility - newvis) * sc;
                
                vec3 lightDelta = g_cloudCentre - sampleP;
                float sc2 = pow(smoothstep(-1.0, 1.0, (SDF(sampleP + normalize(lightDelta) * softness) - h) / softness), 2.0);
                light1 += (visibility - newvis) * sc2 / (dot(lightDelta, lightDelta) + 1.0);
                visibility = newvis;
            }
            
            if (vis <= 0.0 || sampleP.y < 0.0) {
                break;
            }

           
            float shade = shading(texCoord);
            float d = smoothstep(threshold - range, threshold + range, sampleNoise(texCoord)) * opacity;
            float col = shade * 3.0 + ((texCoord.x + texCoord.y) * 0.25) + 0.2;
            ac.rgb += (1.0 - ac.a) * d * col;
            ac.a += (1.0 - ac.a) * d;
            if (ac.a >= 0.95) break;

            p += dir * delta;
        }

        
        vec4 color = vec4(.1, .2, .3, 1.0);
        color += light0 * vec4(.9, .8, .7, 0.0);
        color *= pow(g_blastTime, 0.5) * 0.5;
        color += light1 * vec4(8.0, 2.0, 0.25, 0.0) / (25.0 * pow(g_blastTime + 0.0001, 2.0)); 

        
        color = mix(color, vec4(.2, .4, .8, 1.0) + 0.003 / max(g_blastTime, 0.0001), visibility);
        
        color.rgb += ac.rgb;

       
        color = pow(color, vec4(1.0 / 2.2));
        if (ac.a == 0.0) discard;
        out_FragColor = czm_gammaCorrect(color);
    }
`;