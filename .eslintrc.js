module.exports = {
  root: true,
  // ts eslint 配置
  parserOptions: {
    parser:'@typescript-eslint/parser',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",//没有使用的参数，不会报错。因为个人觉的把可用的参数写上去 有利于以后的维护。
    "@typescript-eslint/no-empty-function":"off", // 方法内部没有逻辑书写，不会报错，可以先定义好方法名，方便使用
    "@typescript-eslint/no-explicit-any":"off", // ts 定义数据类型为any不报错
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
    },
  ]
}