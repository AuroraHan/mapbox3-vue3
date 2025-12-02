import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'

export default {
    //忽视自己
    ignores: ["eslint.config.js"],
    //文件配置
    files: ["**/*.ts", "**/*.vue"],
    //规范配置
    rules: {
        "no-unused-vars": "no",
        "no-console": "warn",
    },

    //针对语言进行配置
    languageOptions: {
        //指定解释器 vue
        parser: vueParser,

        //内部文件解析 ts
        parserOptions: {
            parser: tsParser,
        }
    }
}