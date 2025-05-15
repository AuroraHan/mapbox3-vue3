<template>
    <div class="date-time-range-axis">
        <div class="controls">
            <div class="date-time-input">
                <label>开始时间</label>
                <input type="datetime-local" v-model="startDateTimeInput" @change="updateFromInput('start')"
                    :min="minDateTime" :max="maxDateTime">
            </div>
            <div class="date-time-input">
                <label>结束时间</label>
                <input type="datetime-local" v-model="endDateTimeInput" @change="updateFromInput('end')"
                    :min="minDateTime" :max="maxDateTime">
            </div>
        </div>

        <div class="timeline-container" ref="timelineContainer">
            <div class="timeline" ref="timeline">
                <!-- 日期刻度 -->
                <div v-for="(day, index) in days" :key="'day-' + index" class="day-segment"
                    :style="{ width: `${dayWidth}%` }">
                    <div class="day-label">
                        {{ formatDateLabel(day.date) }}
                    </div>

                    <!-- 小时刻度 -->
                    <div v-for="hour in hoursInDay" :key="'hour-tick-' + index + '-' + hour" class="hour-tick"
                        :style="{ left: `${(hour / hoursInDay) * 100}%` }"></div>

                    <!-- 小时标签 -->
                    <div v-for="hour in hoursInDay" :key="'hour-label-' + index + '-' + hour" class="hour-label"
                        :style="{ left: `${(hour / hoursInDay) * 100}%` }">
                        {{ hour - 1 }}:00
                    </div>
                </div>

                <!-- 选中时间范围 -->
                <div class="selected-range" :style="{
                    left: `${getPositionFromDateTime(selectedStart)}%`,
                    width: `${getPositionFromDateTime(selectedEnd) - getPositionFromDateTime(selectedStart)}%`
                }"></div>

                <!-- 开始时间手柄 -->
                <div class="handle start-handle" :style="{ left: `${getPositionFromDateTime(selectedStart)}%` }"
                    @mousedown="startDrag('start', $event)" @touchstart="startDrag('start', $event)">
                    <div class="handle-tooltip">{{ formatDateTime(selectedStart) }}</div>
                </div>

                <!-- 结束时间手柄 -->
                <div class="handle end-handle" :style="{ left: `${getPositionFromDateTime(selectedEnd)}%` }"
                    @mousedown="startDrag('end', $event)" @touchstart="startDrag('end', $event)">
                    <div class="handle-tooltip">{{ formatDateTime(selectedEnd) }}</div>
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
    name: 'DateTimeRangeAxis',
    props: {
        startDateTime: {
            type: String,
            default: () => new Date().toISOString().slice(0, 16)
        },
        endDateTime: {
            type: String,
            default: () => {
                const date = new Date();
                date.setHours(date.getHours() + 1);
                return date.toISOString().slice(0, 16);
            }
        },
        minDuration: {
            type: Number,
            default: 30 // 最小持续时间(分钟)
        }
    },
    emits: ['update:startDateTime', 'update:endDateTime'],
    setup(props, { emit }) {
        // 常量
        const hoursInDay = 24;
        const minutesInHour = 60;

        // 响应式数据
        const selectedStart = ref(new Date(props.startDateTime));
        const selectedEnd = ref(new Date(props.endDateTime));
        const startDateTimeInput = ref(props.startDateTime.slice(0, 16));
        const endDateTimeInput = ref(props.endDateTime.slice(0, 16));
        const timeline = ref(null);
        const timelineContainer = ref(null);
        const draggingHandle = ref(null);

        // 计算日期范围和天数
        const days = computed(() => {
            const startDate = new Date(selectedStart.value);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(selectedEnd.value);
            endDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            const daysArray = [];

            for (let i = 0; i < daysDiff; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                daysArray.push({ date });
            }

            return daysArray;
        });

        // 计算每天宽度百分比
        const dayWidth = computed(() => {
            return 100 / days.value.length;
        });

        // 计算最小和最大日期时间
        const minDateTime = computed(() => {
            return new Date(selectedStart.value.getTime() - 30 * 24 * 60 * 60 * 1000)
                .toISOString().slice(0, 16);
        });

        const maxDateTime = computed(() => {
            return new Date(selectedEnd.value.getTime() + 30 * 24 * 60 * 60 * 1000)
                .toISOString().slice(0, 16);
        });

        // 格式化方法
        const formatDateTime = (date) => {
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(/\//g, '-');
        };

        const formatDateLabel = (date) => {
            return date.toLocaleDateString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                weekday: 'short'
            }).replace(/\//g, '-');
        };

        const formatDuration = computed(() => {
            const durationMs = selectedEnd.value - selectedStart.value;
            const durationMinutes = Math.floor(durationMs / (1000 * 60));

            if (durationMinutes < 60) {
                return `${durationMinutes}分钟`;
            }

            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;

            if (hours < 24) {
                return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
            }

            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;

            let result = `${days}天`;
            if (remainingHours > 0) {
                result += `${remainingHours}小时`;
            }
            if (minutes > 0 && hours < 48) {
                result += `${minutes}分钟`;
            }

            return result;
        });

        // 位置计算方法
        const getPositionFromDateTime = (date) => {
            const startDate = new Date(days.value[0].date);
            startDate.setHours(0, 0, 0, 0);

            const totalDuration = days.value.length * 24 * 60 * 60 * 1000;
            const elapsed = date - startDate;

            return (elapsed / totalDuration) * 100;
        };

        const getDateTimeFromPosition = (percent) => {
            const startDate = new Date(days.value[0].date);
            startDate.setHours(0, 0, 0, 0);

            const totalDuration = days.value.length * 24 * 60 * 60 * 1000;
            const elapsed = (percent / 100) * totalDuration;

            return new Date(startDate.getTime() + elapsed);
        };

        // 更新方法
        const updateFromInput = (type) => {
            const dateTime = type === 'start' ? startDateTimeInput.value : endDateTimeInput.value;
            const newDate = new Date(dateTime);

            if (type === 'start') {
                if (newDate >= selectedEnd.value) {
                    startDateTimeInput.value = props.startDateTime.slice(0, 16);
                    return;
                }
                selectedStart.value = newDate;
                emit('update:startDateTime', newDate.toISOString());
            } else {
                if (newDate <= selectedStart.value) {
                    endDateTimeInput.value = props.endDateTime.slice(0, 16);
                    return;
                }
                selectedEnd.value = newDate;
                emit('update:endDateTime', newDate.toISOString());
            }
        };

        // 拖动处理方法
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

            const newDate = getDateTimeFromPosition(percent);

            if (draggingHandle.value === 'start') {
                const minEndDate = new Date(selectedEnd.value);
                minEndDate.setMinutes(minEndDate.getMinutes() - props.minDuration);

                const clampedDate = newDate < minEndDate ? newDate : minEndDate;
                selectedStart.value = clampedDate;
                startDateTimeInput.value = clampedDate.toISOString().slice(0, 16);
                emit('update:startDateTime', clampedDate.toISOString());
            } else {
                const minStartDate = new Date(selectedStart.value);
                minStartDate.setMinutes(minStartDate.getMinutes() + props.minDuration);

                const clampedDate = newDate > minStartDate ? newDate : minStartDate;
                selectedEnd.value = clampedDate;
                endDateTimeInput.value = clampedDate.toISOString().slice(0, 16);
                emit('update:endDateTime', clampedDate.toISOString());
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

        // 初始化
        onMounted(() => {
            selectedStart.value = new Date(props.startDateTime);
            selectedEnd.value = new Date(props.endDateTime);
        });

        // 监听props变化
        watch(() => props.startDateTime, (newVal) => {
            selectedStart.value = new Date(newVal);
            startDateTimeInput.value = newVal.slice(0, 16);
        });

        watch(() => props.endDateTime, (newVal) => {
            selectedEnd.value = new Date(newVal);
            endDateTimeInput.value = newVal.slice(0, 16);
        });

        return {
            hoursInDay,
            selectedStart,
            selectedEnd,
            startDateTimeInput,
            endDateTimeInput,
            minDateTime,
            maxDateTime,
            days,
            dayWidth,
            timeline,
            timelineContainer,
            formatDuration,
            formatDateTime,
            formatDateLabel,
            getPositionFromDateTime,
            updateFromInput,
            startDrag
        };
    }
};
</script>

<style scoped>
.date-time-range-axis {
    width: 100%;
    max-width: 1000px;
    margin: 20px auto;
    font-family: Arial, sans-serif;
}

.controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    gap: 20px;
}

.date-time-input {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.date-time-input label {
    margin-bottom: 5px;
    font-weight: bold;
}

.date-time-input input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
}

.timeline-container {
    width: 100%;
    overflow-x: auto;
    padding: 30px 0 20px;
    background-color: #f8f8f8;
    border-radius: 4px;
}

.timeline {
    position: relative;
    height: 80px;
    min-width: calc(100% - 40px);
    margin: 0 20px;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.day-segment {
    position: relative;
    display: inline-block;
    height: 100%;
    border-right: 1px solid #eee;
    box-sizing: border-box;
}

.day-label {
    position: absolute;
    top: -25px;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: #333;
}

.hour-tick {
    position: absolute;
    top: 0;
    width: 1px;
    height: 15px;
    background-color: #ddd;
}

.hour-label {
    position: absolute;
    top: 18px;
    transform: translateX(-50%);
    font-size: 10px;
    color: #999;
}

.selected-range {
    position: absolute;
    top: 20px;
    height: 40px;
    background-color: rgba(100, 180, 255, 0.3);
    border-radius: 4px;
}

.handle {
    position: absolute;
    top: 20px;
    width: 8px;
    height: 40px;
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
    font-weight: bold;
}
</style>