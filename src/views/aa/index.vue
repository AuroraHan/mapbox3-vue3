<template>
    <div>
        <h1>sss</h1>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
//创建canvas对象
const createMovingBallCanvas = () => {
    // 创建 canvas 元素
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    let x = 10; // 小球的初始 x 坐标
    let y = 20; // 小球的初始 y 坐标
    let dx = 2; // x 方向的速度
    let dy = 2; // y 方向的速度
    const radius = 20; // 小球半径

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

onMounted(() => {
    const aa = createMovingBallCanvas()
    console.log(aa);

})
</script>

<style scoped></style>