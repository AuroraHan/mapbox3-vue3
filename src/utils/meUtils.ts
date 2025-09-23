import { customRef } from 'vue'

//自定义防抖
export const debounceRef = (value: any, delay = 1000) => {
    let timeId: number;
    return customRef((track, trigger) => ({
        get() {
            track()
            return value
        },
        set(newValue) {
            clearTimeout(timeId)
            timeId = setTimeout(() => {
                value = newValue
                trigger()
            }, delay)
        }
    }))
}