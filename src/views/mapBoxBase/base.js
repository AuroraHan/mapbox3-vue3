//添加动图
const addGif = () => {
  fetch("/images/fly.gif")
    .then((res) => res.arrayBuffer())
    .then((res) => {
      const canvasIcon = new CanvasIcon(476, 280, {
        autoPixelRatio: true,
        onAdd(ctx: any) {
          ctx.gif = AnimatedGIF.fromBuffer(res, ctx.context, {});
        },
        renderCallback(ctx: any) {
          ctx.gif.update(performance.now() / 1000);
          ctx.gif.updateFrame();
        },
        postRender(ctx) {
          mapR.triggerRepaint();
        },
      });

      const markerId = `animate-icon`;

      if (!mapR.hasImage(markerId)) {
        mapR.addImage(markerId, canvasIcon);
      }

      mapR.addSource("point", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: [120, 30],
              },
            },
          ],
        },
      });

      mapR.addLayer({
        id: "point",
        type: "symbol",
        source: "point",
        layout: {
          visibility: "visible",
          "icon-image": markerId,
          "icon-size": 0.2,
          "icon-anchor": "bottom",
          "icon-ignore-placement": true,
          "icon-allow-overlap": true, // 图标允许压盖
        },
        paint: {},
        filter: ["all", ["in", "$type", "Point"]],
      });
    });
}



//初始化无人机动图
const initWrj = () => {
    for (let i = 1; i < 4; i++) {
        mapR.loadImage("/images/wrj/" + i + ".png", (error, image) => {
            mapR.addImage("mwrj" + i, image!);
        });
    }
}
const currentI = ref(0)

// 更新台风图片,实现gif功能
const updateTaiFengImage = () => {
    let layerId = "wrjpoint";
    if (mapR.getLayer(layerId) != undefined) {
        let currentImage = (currentI.value + 1) % 4;
        mapR.setLayoutProperty(
            layerId,
            "icon-image",
            "mwrj" + currentImage
        );
        currentI.value = currentImage;
    }
    requestAnimationFrame(updateTaiFengImage);
}

const addWrj = () => {
    mapR.addSource('point', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Point',
                        coordinates: [120, 30],
                    },
                },
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Point',
                        coordinates: [136, 30],
                    },
                },

            ],
        },
    });

    mapR.addLayer({
        id: 'wrjpoint',
        type: 'symbol',
        source: 'point',
        layout: {
            'icon-image': 'mwrj0',
            'icon-size': 0.3,
            'icon-anchor': 'bottom',
            'icon-ignore-placement': true,
            'icon-allow-overlap': true, // 图标允许压盖
        },
        paint: {},
        filter: ['all', ['in', '$type', 'Point']],
    });

    requestAnimationFrame(updateTaiFengImage);
}



//方法三 ----- 实现
const threeMarker = () => {
    const el = document.createElement('canvas')
    el.style.width = '100px'
    el.style.height = '100px'
    el.style.backgroundImage = 'url(/images/fly.gif)'
    el.style.backgroundSize = '100%';

    new mapbox.Marker(el)
        .setLngLat([120, 30])
        .addTo(mapR);
}

//创建canvas对象
const createMovingBallCanvas = () => {
    // 创建 canvas 元素
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    const ctx = canvas.getContext('2d');

    let x = 10; // 小球的初始 x 坐标
    let y = 10; // 小球的初始 y 坐标
    let dx = 2; // x 方向的速度
    let dy = 2; // y 方向的速度
    const radius = 5; // 小球半径

    function drawBall() {
        ctx?.clearRect(0, 0, canvas.width, canvas.height); // 清除画布
        ctx?.beginPath();
        ctx?.arc(x, y, radius, 0, Math.PI * 2); // 绘制圆形
        ctx!.fillStyle = 'blue';
        ctx?.fill();
        ctx?.closePath();

        // 更新小球位置
        x += dx;
        y += dy;

        // 碰撞检测（反弹）
        if (x + radius > canvas.width || x - radius < 0) {
            dx = -dx;
        }
        if (y + radius > canvas.height || y - radius < 0) {
            dy = -dy;
        }

        requestAnimationFrame(drawBall); // 递归调用动画
    }

    drawBall(); // 启动动画

    return canvas; // 返回 canvas 对象
}



//绘制动态图像
const draw = () => {
  const domC = createMovingBallCanvas()
  console.log(domC);

  new mapbox.Marker(domC)
      .setLngLat([120, 30])
      .addTo(mapR);
}