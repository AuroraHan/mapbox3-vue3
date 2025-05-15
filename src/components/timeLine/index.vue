<template>
    <div class="time-axis-container">
        <div class="timeline" ref="timeline" @click="handleTimelineClick">
            <!-- 小时刻度线 -->
            <div v-for="hour in hoursInDay + 1" :key="'hour-tick-' + hour" class="hour-tick"
                :style="{ left: `${(hour - 1) * minutesInHour}px` }"></div>

            <!-- 小时标签 -->
            <div v-for="hour in hoursInDay" :key="'hour-label-' + hour" class="hour-label"
                :style="{ left: `${hour * minutesInHour}px` }">
                {{ hour - 1 }}:00
            </div>

            <!-- 半小时刻度线 -->
            <div v-for="hour in hoursInDay" :key="'half-hour-tick-' + hour" class="half-hour-tick"
                :style="{ left: `${(hour - 1) * minutesInHour + 30}px` }"></div>

            <!-- 15分钟刻度线 -->
            <div v-for="hour in hoursInDay" :key="'quarter-hour-tick1-' + hour" class="quarter-hour-tick"
                :style="{ left: `${(hour - 1) * minutesInHour + 15}px` }"></div>

            <!-- 45分钟刻度线 -->
            <div v-for="hour in hoursInDay" :key="'quarter-hour-tick2-' + hour" class="quarter-hour-tick"
                :style="{ left: `${(hour - 1) * minutesInHour + 45}px` }"></div>

            <!-- 可拖动的当前时间指示器 -->
            <div class="current-time" ref="currentTime" :style="{ left: `${currentPosition}px` }" @mousedown="startDrag"
                @touchstart="startDrag"></div>
        </div>

        <div class="time-display">
            {{ formattedTime }}
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
export default {
    name: 'TimeAxis',
    props: {
        // 初始时间（分钟数）
        modelValue: {
            type: Number,
            default: 0
        },
        // 是否显示当前时间
        showCurrentTime: {
            type: Boolean,
            default: true
        }
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        // 常量定义
        const hoursInDay = 24;
        const minutesInHour = 60;
        const totalMinutes = hoursInDay * minutesInHour;

        // 响应式数据
        const currentPosition = ref(props.modelValue);
        const timeline = ref(null);
        const currentTime = ref(null);
        const isDragging = ref(false);

        // 计算属性
        const formattedTime = computed(() => {
            const hours = Math.floor(currentPosition.value / 60);
            const minutes = Math.floor(currentPosition.value % 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        });

        // 方法
        const setCurrentTime = (minutes) => {
            const clampedMinutes = Math.max(0, Math.min(totalMinutes, minutes));
            currentPosition.value = clampedMinutes;
            emit('update:modelValue', clampedMinutes);
        };

        const handleTimelineClick = (e) => {
            if (isDragging.value) return;

            const timelineRect = timeline.value.getBoundingClientRect();
            const posX = e.clientX - timelineRect.left;
            setCurrentTime(posX);
        };

        const startDrag = (e) => {
            isDragging.value = true;
            e.preventDefault();

            // 添加事件监听
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', handleDrag);
            document.addEventListener('touchend', stopDrag);
        };

        const handleDrag = (e) => {
            if (!isDragging.value) return;

            const timelineRect = timeline.value.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            let posX = clientX - timelineRect.left;

            setCurrentTime(posX);
            e.preventDefault();
        };

        const stopDrag = () => {
            isDragging.value = false;

            // 移除事件监听
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', handleDrag);
            document.removeEventListener('touchend', stopDrag);
        };

        // 生命周期钩子
        onMounted(() => {
            if (props.showCurrentTime) {
                const now = new Date();
                const hours = now.getHours();
                const minutes = now.getMinutes();
                setCurrentTime(hours * 60 + minutes);
            }
        });

        return {
            hoursInDay,
            minutesInHour,
            currentPosition,
            timeline,
            currentTime,
            formattedTime,
            handleTimelineClick,
            startDrag
        };
    }
};
</script>

<style scoped>
.time-axis-container {
    width: 100%;
    margin: 20px 0;
}

.timeline {
    position: relative;
    height: 60px;
    width: 1440px;
    /* 24小时 * 60分钟 = 1440分钟 */
    background-color: white;
    border-top: 1px solid #ccc;
    cursor: pointer;
}

/* 小时刻度线 */
.hour-tick {
    position: absolute;
    top: 0;
    width: 1px;
    height: 20px;
    background-color: #333;
}

.hour-label {
    position: absolute;
    top: 25px;
    transform: translateX(-50%);
    font-size: 12px;
    color: #333;
}

/* 半小时刻度线 */
.half-hour-tick {
    position: absolute;
    top: 0;
    width: 1px;
    height: 15px;
    background-color: #999;
}

/* 15分钟刻度线 */
.quarter-hour-tick {
    position: absolute;
    top: 0;
    width: 1px;
    height: 10px;
    background-color: #ccc;
}

/* 当前时间指示器 */
.current-time {
    position: absolute;
    top: 0;
    width: 2px;
    height: 30px;
    background-color: red;
    z-index: 10;
    cursor: ew-resize;
    user-select: none;
}

.current-time::after {
    content: '';
    position: absolute;
    top: 30px;
    left: -4px;
    width: 10px;
    height: 10px;
    background-color: red;
    border-radius: 50%;
}

.time-display {
    margin-top: 10px;
    text-align: center;
    font-family: Arial, sans-serif;
    font-size: 16px;
    color: #333;
}
</style>