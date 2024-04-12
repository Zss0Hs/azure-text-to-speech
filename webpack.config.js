const path = require('path');

module.exports = {
  entry: './worker.js', // 你的 Cloudflare Workers 代码文件
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js', // 打包后的文件名
    libraryTarget: 'umd', // 设置为 'umd' 以兼容 CommonJS、AMD 和全局变量导入
  },
  mode: 'production', // 生产模式
};
