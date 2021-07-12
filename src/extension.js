const vscode = require('vscode');


exports.activate = function (context) {
  console.log('激活 addJSDoc')
  console.log(vscode)

  require('./main.js')(context);
  console.log('激活 addJSDoc end')
    
    
}

/**
 * 插件被释放时触发
 */
 exports.deactivate = function() {
  console.log('您的扩展“addJSDoc”已被释放！')
};
