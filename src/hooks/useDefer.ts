import { ref, onUnmounted } from 'vue'

export function useDefer(maxCount = 100) {
    const count = ref(0)
    let reqId: number
    function updateFrame() {
        count.value++
        if (count.value > maxCount) {
            return
        }
        reqId = requestAnimationFrame(updateFrame)
    }

    updateFrame()

    onUnmounted(() => {
        cancelAnimationFrame(reqId)
    })

    return function (n: number) {
        return count.value >= n
    }
}