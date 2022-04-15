import * as vscode from 'vscode'
import {getFormatDate} from '../comm/date';
import {getJsInfo} from '../comm/astParsing'

/**
 * addJSDoc 根据选中都函数参数，进行文档注释
 * @param {*} context vscode插件上下文
 */
module.exports = function(context:vscode.ExtensionContext){
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      return
    }
    


    // 获取 selection 对象(其中包含当前选择的行与字符)
    const selection = editor.selection

    // 获取当前整个一行的代码
    const range = new vscode.Range(
        new vscode.Position(selection.start.line,0),
        new vscode.Position(selection.start.line+1,0)
    )
          
    // 获取选中的内容
    const selectionText = editor.document.getText(range)
    
    //const paramList = m[1].replace(/[\t\s\r]/g, '').split(',').filter(s => s !== '')

    let text = '/**\r'
    text += `* 描述\r`

    // 作者
    const configuration = vscode.workspace.getConfiguration('jsdoc');
    const author = configuration.get('author') || ''
    author && (text += `* @author ${author}\r`)

    // 日期
    text += `* @date ${getFormatDate('YYYY-MM-DD',new Date())}\r`

    // 选中内容的参数
    console.log(34,selectionText,selection)
    const { funInfoArr } = getJsInfo(selectionText) //'function updateChartData(bundleStats:string[]):string {'
    if(funInfoArr.length>0){
      const info = funInfoArr[0]
      // 参数
      text += info.params
      // returns
      if(info.returns){
        text += `* @returns {${info.returns}}\r`
      } 
      text += `*/\r`
    }
    console.log(35,funInfoArr)

    
    editor.edit(editBuilder => {
      // 取上一行的末尾作为插入点
      const selectionLine = editor.document.lineAt(selection.start.line)
      const insertPosition = selectionLine.range.start
      
      // 填充行头的空格
      const whitespace = selectionLine.firstNonWhitespaceCharacterIndex
      const padSpaceStr = ' '.repeat(whitespace)
      text = text.replace(/\r/g, `\r${padSpaceStr} `)
      text = `${padSpaceStr}${text}`
      text = text.slice(0, text.length - whitespace - 1)

      // 插入注释
      editBuilder.insert(insertPosition, text)
    });
}