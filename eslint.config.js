import tsParser from '@typescript-eslint/parser'

export default {
    //忽视自己
    ignores: ["eslint.config.js"],
    //文件配置
    files: ["**/*.ts"],
    //规范配置
    rules: {
        "no-unused-vars": "error",
        "no-console": "warn",
    },

    //针对语言进行配置
    languageOptions: {
        //指定解释器
        parser: tsParser
    }
}