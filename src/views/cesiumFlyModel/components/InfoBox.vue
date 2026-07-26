<template>
  <div class="info-box">
    <div class="info-header">{{ title }}</div>
    <div class="info-content">
      <div class="info-row">
        <span class="label">经度:</span>
        <span class="value">{{ longitude }}°</span>
      </div>
      <div class="info-row">
        <span class="label">纬度:</span>
        <span class="value">{{ latitude }}°</span>
      </div>
      <div class="info-row">
        <span class="label">高度:</span>
        <span class="value">{{ altitude }} m</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string;
  longitude: number | string;
  latitude: number | string;
  altitude: number | string;
}>();
</script>

<style lang="scss" scoped>
.info-box {
  min-width: 140px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  pointer-events: none;
  transform: translate(-50%, -100%);
  margin-top: -15px;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid rgba(0, 0, 0, 0.75);
  }

  .info-header {
    padding: 6px 10px;
    background: rgba(59, 130, 246, 0.8);
    border-radius: 5px 5px 0 0;
    font-weight: bold;
    text-align: center;
  }

  .info-content {
    padding: 8px 10px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: rgba(255, 255, 255, 0.7);
      margin-right: 8px;
    }

    .value {
      color: #4ade80;
      font-family: monospace;
    }
  }
}
</style>