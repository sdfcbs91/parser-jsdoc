import * as vscode from 'vscode'

/**
 * 初始化、进行事件注册 - 插件的主入口
 * *  注册
 *       addJSDoc
 *       initJSDoc
 * *  结束
 * @param {*} context  vscode插件上下文
 */

module.exports = (context:vscode.ExtensionContext):any=>{
  // 注册 addJSDoc 
  // 进行升级,采取新的 genJSDoc替换老的addJSDoc
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.addJSDoc',require("./components/genJSDoc"))
  );
  // 注册 initJSDoc
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.initJSDoc',require("./components/initJSDoc"))
  );
  // 注册 genJSDoc
  // context.subscriptions.push(
  //   vscode.commands.registerCommand('extension.genJSDoc',require("./components/genJSDoc"))
  // );
}