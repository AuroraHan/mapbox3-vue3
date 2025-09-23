<template>
    <div class="contaniner">
        <div class="item" v-for="value in 5000"></div>
    </div>
</template>

<script setup>

</script>

<style scoped lang="scss">
.contaniner {
    .item {
        width: 200px;
        height: 40px;
        border: 1px solid red;
    }
}
</style>