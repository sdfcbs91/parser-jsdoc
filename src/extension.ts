import * as vscode from 'vscode'


exports.activate = function (context:vscode.ExtensionContext) {
  require('./main')(context);
}

/**
 * 插件被释放时触发
 */
 exports.deactivate = function() {
  
};
