import mapbox, { CustomLayerInterface } from "mapbox-gl";
//画出三角形
const loadWebGl = () => {
  const highlightLayer = {
    id: "highlight",
    type: "custom",
    // https://docs.mapbox.com/mapbox-gl-js/api/#styleimageinterface#onadd
    onAdd: function (map, gl) {
      // create GLSL source for vertex shader
      const vertexSource = `
                uniform mat4 u_matrix;
                attribute vec3 a_pos;
                void main() {
                    gl_Position = u_matrix * vec4(a_pos, 1.0);
                }`;

      // create GLSL source for fragment shader
      const fragmentSource = `
                void main() {
                    gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5);
                }`;

      // create a vertex shader
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader!, vertexSource);
      gl.compileShader(vertexShader!);

      // create a fragment shader
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader!, fragmentSource);
      gl.compileShader(fragmentShader!);

      // link the two shaders into a WebGL program
      this.program = gl.createProgram();
      gl.attachShader(this.program, vertexShader!);
      gl.attachShader(this.program, fragmentShader!);
      gl.linkProgram(this.program);

      this.aPos = gl.getAttribLocation(this.program, "a_pos");

      // define vertices of the triangle to be rendered in the custom style layer
      const helsinki = mapbox.MercatorCoordinate.fromLngLat(
        {
          lng: 25.004,
          lat: 60.239,
        },
        30000
      );
      const berlin = mapbox.MercatorCoordinate.fromLngLat(
        {
          lng: 13.403,
          lat: 52.562,
        },
        50000
      );
      const kyiv = mapbox.MercatorCoordinate.fromLngLat(
        {
          lng: 30.498,
          lat: 50.541,
        },
        20000
      );

      // create and initialize a WebGLBuffer to store vertex and color data
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          helsinki.x,
          helsinki.y,
          helsinki.z,
          berlin.x,
          berlin.y,
          berlin.z,
          kyiv.x,
          kyiv.y,
          kyiv.z,
        ]),
        gl.STATIC_DRAW
      );
    },

    // method fired on each animation frame
    // https://docs.mapbox.com/mapbox-gl-js/api/#map.event:render
    render: function (gl, matrix) {
      gl.useProgram(this.program);
      gl.uniformMatrix4fv(
        gl.getUniformLocation(this.program, "u_matrix"),
        false,
        matrix
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.aPos);
      gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
    },
  } as CustomLayerInterface;

  mapR?.addLayer(highlightLayer);
};

//创建粒子效果
const loadPartic = () => {
  const particleLayer = {
    id: "particle-layer",
    type: "custom",
    onAdd: function (map, gl) {
      const vertexSource = `
            uniform mat4 u_matrix;
            attribute vec3 a_pos;
            void main() {
                gl_PointSize = 5.0;
                gl_Position = u_matrix * vec4(a_pos, 1.0);
            }`;

      const fragmentSource = `
            void main() {
                gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); // 黄色粒子
            }`;

      const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vertexShader, vertexSource);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fragmentShader, fragmentSource);
      gl.compileShader(fragmentShader);

      this.program = gl.createProgram()!;
      gl.attachShader(this.program, vertexShader);
      gl.attachShader(this.program, fragmentShader);
      gl.linkProgram(this.program);

      this.aPos = gl.getAttribLocation(this.program, "a_pos");
      const generateRandomParticles = (count: number) => {
        const particles: any[] = [];
        const beijing = mapbox.MercatorCoordinate.fromLngLat({
          lng: 116.4074,
          lat: 39.9042,
        });

        for (let i = 0; i < count; i++) {
          const randomLng = 116.4074 + Math.random() * 0.1 - 0.05;
          const randomLat = 39.9042 + Math.random() * 0.1 - 0.05;
          const randomAltitude = 10000 + Math.random() * 40000;

          const position = mapbox.MercatorCoordinate.fromLngLat(
            { lng: randomLng, lat: randomLat },
            randomAltitude
          );

          particles.push(position.x, position.y, position.z);
        }
        return particles;
      };

      const particlePositions = generateRandomParticles(1000);

      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(particlePositions),
        gl.STATIC_DRAW
      );
    },

    render: function (gl, matrix) {
      gl.useProgram(this.program);
      gl.uniformMatrix4fv(
        gl.getUniformLocation(this.program, "u_matrix"),
        false,
        matrix
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.aPos);
      gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.POINTS, 0, 1000);
    },
  } as mapbox.CustomLayerInterface;

  // 添加到地图
  mapR?.addLayer(particleLayer);
};

//根据不同高度创建粒子效果
const loadParticHight = () => {
  const particleLayer = {
    id: "particle-layer",
    type: "custom",
    onAdd: function (map, gl) {
      // 顶点着色器
      const vertexSource = `
            uniform mat4 u_matrix;
            attribute vec3 a_pos;
            attribute vec3 a_color;
            varying vec3 v_color;
            void main() {
                gl_PointSize = 8.0;
                v_color = a_color; // 将颜色传递到片元着色器
                gl_Position = u_matrix * vec4(a_pos, 1.0);
            }`;

      // 片元着色器
      const fragmentSource = `
            precision mediump float;
            varying vec3 v_color;
            void main() {
                float distance = length(gl_PointCoord - vec2(0.5));
                if (distance > 0.5) discard; // 创建圆形粒子
                float alpha = smoothstep(0.5, 0.45, distance);//抗锯齿效果：通过距离增加颜色的渐变。
                gl_FragColor = vec4(v_color, alpha); // 应用顶点传递的颜色
            }`;

      // 编译顶点着色器
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vertexShader, vertexSource);
      gl.compileShader(vertexShader);

      // 编译片元着色器
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fragmentShader, fragmentSource);
      gl.compileShader(fragmentShader);

      // 创建 WebGL 程序并链接
      this.program = gl.createProgram()!;
      gl.attachShader(this.program, vertexShader);
      gl.attachShader(this.program, fragmentShader);
      gl.linkProgram(this.program);

      // 检查链接状态
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        console.error(
          "Program Linking Error: ",
          gl.getProgramInfoLog(this.program)
        );
        return;
      }

      // 获取属性位置
      this.aPos = gl.getAttribLocation(this.program, "a_pos");
      this.aColor = gl.getAttribLocation(this.program, "a_color");

      // 生成粒子
      const { positions, colors } = generateRandomParticles(100000);

      // 创建位置缓冲区
      this.positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW
      );

      // 创建颜色缓冲区
      this.colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    },

    render: function (gl, matrix) {
      gl.useProgram(this.program);

      // 绑定位置缓冲区
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(this.aPos);
      gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);

      // 绑定颜色缓冲区
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.enableVertexAttribArray(this.aColor);
      gl.vertexAttribPointer(this.aColor, 3, gl.FLOAT, false, 0, 0);

      // 设置矩阵
      gl.uniformMatrix4fv(
        gl.getUniformLocation(this.program, "u_matrix"),
        false,
        matrix
      );

      // 启用混合以支持透明度
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // 绘制粒子
      gl.drawArrays(gl.POINTS, 0, 100000);
    },
  } as mapboxgl.CustomLayerInterface;

  // 添加到地图
  //   mapR?.addLayer(particleLayer);
};

// 创建随机粒子数据
const generateRandomParticles = (count: number) => {
  const positions: any[] = [];
  const colors: any[] = [];
  for (let i = 0; i < count; i++) {
    // 随机经纬度位置
    const randomLng = 116.4074 + Math.random() * 0.1 - 0.05;
    const randomLat = 39.9042 + Math.random() * 0.1 - 0.05;
    const randomAltitude = 10000 + Math.random() * 40000;

    const position = mapbox.MercatorCoordinate.fromLngLat(
      { lng: randomLng, lat: randomLat },
      randomAltitude
    );
    positions.push(position.x, position.y, position.z);

    // 随机颜色
    colors.push(Math.random(), Math.random(), Math.random());
  }
  return { positions, colors };
};

//------使用一个缓冲去，只需一次绑定
const singularLoadParticHight = () => {
  const particleLayer = {
    id: "particle-layer",
    type: "custom",
    onAdd: function (map, gl) {
      // 顶点着色器
      const vertexSource = `
            uniform mat4 u_matrix;
            attribute vec3 a_pos;
            attribute vec3 a_color;
            varying vec3 v_color;
            void main() {
                gl_PointSize = 8.0;
                v_color = a_color; // 将颜色传递到片元着色器
                gl_Position = u_matrix * vec4(a_pos, 1.0);
            }`;

      // 片元着色器
      const fragmentSource = `
            precision mediump float;
            varying vec3 v_color;
            void main() {
                float distance = length(gl_PointCoord - vec2(0.5));
                if (distance > 0.5) discard; // 创建圆形粒子
                gl_FragColor = vec4(v_color, 1.0); // 应用顶点传递的颜色
            }`;

      // 编译顶点着色器
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vertexShader, vertexSource);
      gl.compileShader(vertexShader);

      // 编译片元着色器
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fragmentShader, fragmentSource);
      gl.compileShader(fragmentShader);

      // 创建 WebGL 程序并链接
      this.program = gl.createProgram()!;
      gl.attachShader(this.program, vertexShader);
      gl.attachShader(this.program, fragmentShader);
      gl.linkProgram(this.program);

      // 检查链接状态
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        console.error(
          "Program Linking Error: ",
          gl.getProgramInfoLog(this.program)
        );
        return;
      }

      // 获取属性位置
      this.aPos = gl.getAttribLocation(this.program, "a_pos");
      this.aColor = gl.getAttribLocation(this.program, "a_color");

      // 生成粒子数据
      const particleData = generateParticleData(100000);

      // 创建缓冲区并存储粒子数据
      this.particleBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(particleData),
        gl.STATIC_DRAW
      );

      // 每个粒子占用 6 个浮点数（3 个位置 + 3 个颜色）
      this.stride = 6 * Float32Array.BYTES_PER_ELEMENT;
    },

    render: function (gl, matrix) {
      gl.useProgram(this.program);

      // 绑定粒子缓冲区
      gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);

      // 设置位置属性
      gl.enableVertexAttribArray(this.aPos);
      gl.vertexAttribPointer(
        this.aPos, // 属性位置
        3, // 每个顶点的分量数 (x, y, z)
        gl.FLOAT, // 数据类型
        false, // 是否标准化
        this.stride, // 每个粒子的总大小
        0 // 偏移量 (位置数据从第 0 个字节开始)
      );

      // 设置颜色属性
      gl.enableVertexAttribArray(this.aColor);
      gl.vertexAttribPointer(
        this.aColor, // 属性位置
        3, // 每个颜色的分量数 (r, g, b)
        gl.FLOAT, // 数据类型
        false, // 是否标准化
        this.stride, // 每个粒子的总大小
        3 * Float32Array.BYTES_PER_ELEMENT // 偏移量 (颜色数据从第 3 个字节开始)
      );

      // 设置矩阵
      gl.uniformMatrix4fv(
        gl.getUniformLocation(this.program, "u_matrix"),
        false,
        matrix
      );

      // 启用混合以支持透明度
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // 绘制粒子
      gl.drawArrays(gl.POINTS, 0, 100000);
    },
  } as mapboxgl.CustomLayerInterface;

  // 添加到地图
  //   mapR?.addLayer(particleLayer);
};

// 创建粒子数据
const generateParticleData = (count: number) => {
  const data: any[] = [];
  for (let i = 0; i < count; i++) {
    // 随机经纬度位置
    const randomLng = 116.4074 + Math.random() * 0.1 - 0.05;
    const randomLat = 39.9042 + Math.random() * 0.1 - 0.05;
    const randomAltitude = 10000 + Math.random() * 40000;

    const position = mapbox.MercatorCoordinate.fromLngLat(
      { lng: randomLng, lat: randomLat },
      randomAltitude
    );

    // 添加位置 (x, y, z)
    data.push(position.x, position.y, position.z);

    // 添加颜色 (r, g, b)
    data.push(Math.random(), Math.random(), Math.random());
  }
  return data;
};

//实现简单的动画效果
const animationLoadPartic = () => {
  const particleLayer = {
    id: "particle-layer",
    type: "custom",
    onAdd: function (map, gl) {
      const vertexSource = `
            uniform mat4 u_matrix;
            attribute vec3 a_pos;
            void main() {
                gl_PointSize = 5.0;
                gl_Position = u_matrix * vec4(a_pos, 1.0);
            }`;

      const fragmentSource = `
            void main() {
                gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); // 黄色粒子
            }`;

      const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vertexShader, vertexSource);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fragmentShader, fragmentSource);
      gl.compileShader(fragmentShader);

      this.program = gl.createProgram()!;
      gl.attachShader(this.program, vertexShader);
      gl.attachShader(this.program, fragmentShader);
      gl.linkProgram(this.program);

      this.aPos = gl.getAttribLocation(this.program, "a_pos");

      // 生成粒子数据
      const generateRandomParticles = (count) => {
        const particles: any[] = [];
        const beijing = mapbox.MercatorCoordinate.fromLngLat({
          lng: 116.4074,
          lat: 39.9042,
        });

        for (let i = 0; i < count; i++) {
          const randomLng = 116.4074 + Math.random() * 0.1 - 0.05;
          const randomLat = 39.9042 + Math.random() * 0.1 - 0.05;
          const randomAltitude = 10000 + Math.random() * 10000;

          const position = mapbox.MercatorCoordinate.fromLngLat(
            { lng: randomLng, lat: randomLat },
            randomAltitude
          );

          particles.push(position.x, position.y, position.z);
        }
        return particles;
      };

      this.particlePositions = generateRandomParticles(1000);

      // 创建缓冲区并绑定数据
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(this.particlePositions),
        gl.STATIC_DRAW
      );

      // 记录时间，用于控制粒子的上下运动
      this.time = 0;

      // 使用 requestAnimationFrame 动态更新粒子
      const animateParticles = () => {
        map.triggerRepaint(); // 强制刷新图层
        requestAnimationFrame(animateParticles);
      };

      // 启动动画
      animateParticles();
    },

    render: function (gl, matrix) {
      gl.useProgram(this.program);
      gl.uniformMatrix4fv(
        gl.getUniformLocation(this.program, "u_matrix"),
        false,
        matrix
      );

      // 更新粒子位置，使其上下浮动
      const timeStep = 0.01; // 时间步长
      this.time += timeStep;

      const floatingAmplitude = 10; // 上下浮动的幅度
      const frequency = 1; // 频率

      // 更新粒子的z轴位置
      const updatedPositions: any[] = [];
      for (let i = 0; i < this.particlePositions.length; i += 3) {
        const x = this.particlePositions[i];
        const y = this.particlePositions[i + 1];
        const z = this.particlePositions[i + 2];

        // 使粒子在z轴上下浮动，使用sin函数
        const newZ =
          z + Math.sin(this.time * frequency + i * 0.01) * floatingAmplitude;

        updatedPositions.push(x, y, newZ);
      }

      // 更新粒子缓冲区数据
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(updatedPositions),
        gl.STATIC_DRAW
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.aPos);
      gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.POINTS, 0, 1000); // 使用粒子数量
    },
  } as mapboxgl.CustomLayerInterface;

  // 添加到地图
  //   mapR?.addLayer(particleLayer);
};

export const addWindIcon = (map: mapboxgl.Map) => {
  for (let i = 1; i < 11; i++) {
    map.loadImage("/images/wind/fl_" + i + ".png", (error, image) => {
      if (error || !image) return;
      map.addImage("wind" + i, image);
    });
  }
  console.log("风力图标加载完成");
};
