const vscode = require('vscode');

/**
 * 初始化、进行事件注册 - 插件的主入口
 * *  注册
 *       addJSDoc
 *       initJSDoc
 * *  结束
 * @param {*} context  vscode插件上下文
 */

module.exports = function(context){
  // 注册 addJSDoc
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.addJSDoc',require("./components/addJSDoc.js"))
  )
  // 注册 initJSDoc
}