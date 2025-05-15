<template>
    <div class="time-range-axis">
        <div class="controls">
            <div class="time-input">
                <label>开始时间</label>
                <input type="time" v-model="startTimeInput" @change="updateFromTimeInput('start')" step="300">
            </div>
            <div class="time-input">
                <label>结束时间</label>
                <input type="time" v-model="endTimeInput" @change="updateFromTimeInput('end')" step="300">
            </div>
        </div>

        <div class="timeline-container" ref="timelineContainer">
            <div class="timeline" ref="timeline" @click="handleTimelineClick">
                <!-- 背景刻度线 -->
                <div v-for="hour in hoursInDay + 1" :key="'hour-tick-' + hour" class="hour-tick"
                    :style="{ left: `${getPositionFromTime((hour - 1) * 60)}%` }"></div>

                <!-- 小时标签 -->
                <div v-for="hour in hoursInDay" :key="'hour-label-' + hour" class="hour-label"
                    :style="{ left: `${getPositionFromTime(hour * 60)}%` }">
                    {{ formatHour(hour - 1) }}
                </div>

                <!-- 时间范围选择区域 -->
                <div class="selected-range" :style="{
                    left: `${getPositionFromTime(startMinutes)}%`,
                    width: `${getPositionFromTime(endMinutes) - getPositionFromTime(startMinutes)}%`
                }"></div>

                <!-- 开始时间手柄 -->
                <div class="handle start-handle" :style="{ left: `${getPositionFromTime(startMinutes)}%` }"
                    @mousedown="startDrag('start', $event)" @touchstart="startDrag('start', $event)">
                    <div class="handle-tooltip">{{ formatTime(startMinutes) }}</div>
                </div>

                <!-- 结束时间手柄 -->
                <div class="handle end-handle" :style="{ left: `${getPositionFromTime(endMinutes)}%` }"
                    @mousedown="startDrag('end', $event)" @touchstart="startDrag('end', $event)">
                    <div class="handle-tooltip">{{ formatTime(endMinutes) }}</div>
                </div>
            </div>
        </div>

        <div class="duration-display">
            持续时间: {{ formatDuration }}
        </div>
    </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';

export default {
    name: 'TimeRangeAxis',
    props: {
        startTime: {
            type: String,
            default: '08:00'
        },
        endTime: {
            type: String,
            default: '17:00'
        },
        minDuration: {
            type: Number,
            default: 30 // 最小持续时间(分钟)
        }
    },
    emits: ['update:startTime', 'update:endTime'],
    setup(props, { emit }) {
        // 常量
        const hoursInDay = 24;
        const minutesInHour = 60;

        // 响应式数据
        const startMinutes = ref(0);
        const endMinutes = ref(0);
        const startTimeInput = ref('');
        const endTimeInput = ref('');
        const timeline = ref(null);
        const timelineContainer = ref(null);
        const draggingHandle = ref(null);

        // 初始化
        const initTimes = () => {
            const [startHour, startMinute] = props.startTime.split(':').map(Number);
            const [endHour, endMinute] = props.endTime.split(':').map(Number);

            startMinutes.value = startHour * 60 + startMinute;
            endMinutes.value = endHour * 60 + endMinute;

            startTimeInput.value = props.startTime;
            endTimeInput.value = props.endTime;
        };

        // 计算属性
        const formatDuration = computed(() => {
            const duration = endMinutes.value - startMinutes.value;
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;

            if (hours > 0 && minutes > 0) {
                return `${hours}小时${minutes}分钟`;
            } else if (hours > 0) {
                return `${hours}小时`;
            } else {
                return `${minutes}分钟`;
            }
        });

        // 方法
        const formatTime = (minutes) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        const formatHour = (hour) => {
            return `${hour.toString().padStart(2, '0')}:00`;
        };

        const getPositionFromTime = (minutes) => {
            return (minutes / (hoursInDay * minutesInHour)) * 100;
        };

        const getTimeFromPosition = (percent) => {
            return Math.round(percent * (hoursInDay * minutesInHour) / 100);
        };

        const updateFromTimeInput = (type) => {
            const time = type === 'start' ? startTimeInput.value : endTimeInput.value;
            const [hours, minutes] = time.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes;

            if (type === 'start') {
                if (totalMinutes >= endMinutes.value) {
                    startTimeInput.value = formatTime(startMinutes.value);
                    return;
                }
                startMinutes.value = totalMinutes;
                emit('update:startTime', formatTime(totalMinutes));
            } else {
                if (totalMinutes <= startMinutes.value) {
                    endTimeInput.value = formatTime(endMinutes.value);
                    return;
                }
                endMinutes.value = totalMinutes;
                emit('update:endTime', formatTime(totalMinutes));
            }
        };

        const handleTimelineClick = (e) => {
            if (draggingHandle.value) return;

            const timelineRect = timeline.value.getBoundingClientRect();
            const clickX = e.clientX - timelineRect.left;
            const percent = (clickX / timelineRect.width) * 100;
            const clickedMinutes = getTimeFromPosition(percent);

            // 判断点击位置靠近哪个手柄
            const startDist = Math.abs(clickedMinutes - startMinutes.value);
            const endDist = Math.abs(clickedMinutes - endMinutes.value);

            if (startDist < endDist) {
                const newStart = Math.min(clickedMinutes, endMinutes.value - props.minDuration);
                startMinutes.value = newStart;
                startTimeInput.value = formatTime(newStart);
                emit('update:startTime', formatTime(newStart));
            } else {
                const newEnd = Math.max(clickedMinutes, startMinutes.value + props.minDuration);
                endMinutes.value = newEnd;
                endTimeInput.value = formatTime(newEnd);
                emit('update:endTime', formatTime(newEnd));
            }
        };

        const startDrag = (handleType, e) => {
            draggingHandle.value = handleType;
            e.preventDefault();

            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', handleDrag);
            document.addEventListener('touchend', stopDrag);
        };

        const handleDrag = (e) => {
            if (!draggingHandle.value) return;

            const timelineRect = timeline.value.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            let posX = clientX - timelineRect.left;
            let percent = (posX / timelineRect.width) * 100;
            percent = Math.max(0, Math.min(100, percent));
            const newMinutes = getTimeFromPosition(percent);

            if (draggingHandle.value === 'start') {
                const clampedMinutes = Math.min(newMinutes, endMinutes.value - props.minDuration);
                startMinutes.value = Math.max(0, clampedMinutes);
                startTimeInput.value = formatTime(startMinutes.value);
                emit('update:startTime', formatTime(startMinutes.value));
            } else {
                const clampedMinutes = Math.max(newMinutes, startMinutes.value + props.minDuration);
                endMinutes.value = Math.min(hoursInDay * minutesInHour, clampedMinutes);
                endTimeInput.value = formatTime(endMinutes.value);
                emit('update:endTime', formatTime(endMinutes.value));
            }

            e.preventDefault();
        };

        const stopDrag = () => {
            draggingHandle.value = null;

            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', handleDrag);
            document.removeEventListener('touchend', stopDrag);
        };

        // 生命周期钩子
        onMounted(() => {
            initTimes();
        });

        // 监听props变化
        watch(() => props.startTime, (newVal) => {
            const [hours, minutes] = newVal.split(':').map(Number);
            startMinutes.value = hours * 60 + minutes;
            startTimeInput.value = newVal;
        });

        watch(() => props.endTime, (newVal) => {
            const [hours, minutes] = newVal.split(':').map(Number);
            endMinutes.value = hours * 60 + minutes;
            endTimeInput.value = newVal;
        });

        return {
            hoursInDay,
            minutesInHour,
            startMinutes,
            endMinutes,
            startTimeInput,
            endTimeInput,
            timeline,
            timelineContainer,
            formatDuration,
            formatTime,
            formatHour,
            getPositionFromTime,
            updateFromTimeInput,
            handleTimelineClick,
            startDrag
        };
    }
};
</script>

<style scoped>
.time-range-axis {
    width: 100%;
    max-width: 800px;
    margin: 20px auto;
    font-family: Arial, sans-serif;
}

.controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
}

.time-input {
    display: flex;
    flex-direction: column;
}

.time-input label {
    margin-bottom: 5px;
    font-weight: bold;
}

.time-input input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
}

.timeline-container {
    width: 100%;
    overflow-x: auto;
    padding: 20px 0;
}

.timeline {
    position: relative;
    height: 60px;
    min-width: 1440px;
    /* 24小时 * 60分钟 = 1440分钟 */
    background-color: #f5f5f5;
    border-radius: 4px;
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

/* 选中时间范围 */
.selected-range {
    position: absolute;
    top: 0;
    height: 100%;
    background-color: rgba(100, 180, 255, 0.3);
    border-radius: 4px;
}

/* 手柄样式 */
.handle {
    position: absolute;
    top: 0;
    width: 8px;
    height: 100%;
    background-color: #4a90e2;
    cursor: ew-resize;
    user-select: none;
    z-index: 10;
    transform: translateX(-50%);
}

.handle:hover {
    background-color: #2a70c2;
}

.handle-tooltip {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s;
}

.handle:hover .handle-tooltip {
    opacity: 1;
}

.start-handle {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
}

.end-handle {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
}

.duration-display {
    margin-top: 15px;
    text-align: center;
    font-size: 16px;
    color: #333;
}
</style>