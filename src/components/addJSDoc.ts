import {workspace,ExtensionContext,window} from 'vscode'
import {getFormatDate} from '../comm/date';
import {getFuncJson} from '../comm/parsing'

/**
 * addJSDoc 根据选中都函数参数，进行文档注释
 * @param {*} context vscode插件上下文
 */
module.exports = function(context:ExtensionContext){
    const editor = window.activeTextEditor
    if (!editor) {
      return
    }
    // 定义匹配规则
    // (param:xx,param:xx)
    // const getParamReg = /\(([^)]*)\)/
    // // ?:sombody[] 
    // const paramEndReg = /[?]{0,1}\:(\s)*\w+(\[\])*/g
    // // ?:
    // const paramTypeReg = /[?]{0,1}\:(\s)*/g

    // 获取 selection 对象(其中包含当前选择的行与字符)
    const selection = editor.selection
    // 获取选中的内容
    const selectionText = editor.document.getText(selection)
    
    // 获取参数列表, 去除其中的空格与回车
    // const m = selectionText.match(getParamReg)

    // if(!m) {
    //   return
    // }

    

    //const paramList = m[1].replace(/[\t\s\r]/g, '').split(',').filter(s => s !== '')

    let text = '/**\r'
    text += `* 描述\r`

    // 作者
    const configuration = workspace.getConfiguration('jsdoc');
    const author = configuration.get('author') || ''
    author && (text += `* @author ${author}\r`)

    // 日期
    text += `* @date ${getFormatDate('YYYY-MM-DD',new Date())}\r`

    // 选中内容的参数
    let fJson = getFuncJson(selectionText)
    if(fJson !== null){
      // 参数
       fJson.params.forEach((par)=>{
        text += `* @param {${par.typeStr}} ${par.nameStr}\r`
      })

      // 返回值
      text += `* @returns {${fJson.resTypeStr||'any'}}\r`
      text += `*/\r`
    }else{
      text += '* @returns {any}\r'
      text += `*/\r`
    }  
    
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