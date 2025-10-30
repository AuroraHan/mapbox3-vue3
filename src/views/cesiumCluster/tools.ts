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
  update(frameState) {
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
  _drawCommand(_drawCommand: any) {
    throw new Error('Method not implemented.');
  }

  destroy() {
    return destroyObject(this);
  }

  isDestroyed() {
    return false;
  }
}
// GeometryPrimitive end

export function makeTexture3D(context) {

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
    // sampler: Sampler({
    //   minificationFilter: Cesium.TextureMinificationFilter.LINEAR,
    //   magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR,
    // }),
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

for (let i = 0; i < 256; i++) {
  _p[256 + i] = _p[i];
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y,
    v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/**
 * A utility class providing a 3D noise function.
 *
 * The code is based on [IMPROVED NOISE]{@link https://cs.nyu.edu/~perlin/noise/}
 * by Ken Perlin, 2002.
 *
 * @three_import import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
 */
class ImprovedNoise {
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