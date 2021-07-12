const vscode = require('vscode');
const {getFormatDate} = require('./date.js');


module.exports = function(context){
  console.log('main.js')
  context.subscriptions.push(vscode.commands.registerCommand(
    'extension.addJSDoc',(context)=>{
      const editor = vscode.window.activeTextEditor
      if (!editor) {
        return
      }
      console.log(13,editor.document.getText())
      // 获取 selection 对象(其中包含当前选择的行与字符)
      const selection = editor.selection
      // 获取选中的内容
      const selectionText = editor.document.getText(selection)
      const getParamReg = /\(([^)]*)\)/
      // 获取参数列表, 去除其中的空格与回车
      const m = selectionText.match(getParamReg)

      if(!m) {
        return
      }
      const paramList = m[1].replace(/[\t\s\r]/g, '').split(',').filter(s => s !== '')

      // ?:sombody 规则
      const paramEndReg = /[?]{0,1}\:(\s)*\w+/g
      const paramTypeReg = /[?]{0,1}\:(\s)*/g
      
      editor.edit(editBuilder => {
        // 取上一行的末尾作为插入点
        const selectionLine = editor.document.lineAt(selection.start.line)
        const insertPosition = selectionLine.range.start
        let text = '/**\r'
        text += `* 描述\r`
        // 作者
        const configuration = vscode.workspace.getConfiguration('jsdoc');
        const author = configuration.get('author') || ''
        author && (text += `* @author ${author}\r`)
    
        // 日期
        text += `* @date ${getFormatDate('YYYY-MM-DD',new Date())}\r`
        
        // 参数
        text += paramList
          .map((paramName)=>{
            // vscode.window.showInformationMessage(paramName);
            //paramName xx?: string
            // 是否具备 :类型
            let regArr = paramName.match(paramEndReg)
            let typeStr = 'any'
            let paramStr = paramName
            
            if(regArr&&regArr.length>0){
              // ?:somebody
              let endParam = regArr[0]
              let symbolArr = endParam.match(paramTypeReg)

              if(symbolArr && symbolArr.length>0){
                //把 ?:\s*\w+ 替换为""，剩下的就为参数名param
                paramStr = paramName.replace(paramEndReg,"").trim()
                //把 ?:\s* 替换掉为"",剩下的就为参数type
                typeStr = endParam.replace(paramTypeReg,"").trim()
                let symbolStr = symbolArr[0].replace("/\s/g","")
                // 必填 : somebody 
                // 可选 ?: [somebody] 
                if(symbolStr.indexOf('?:')>-1){
                  paramStr = `[${paramStr}]`
                }
                
              }
            }
            return `* @param {${typeStr}} ${paramStr}\r`
          } )
          .join('')
        // 返回值
        text += `* @returns {any}\r`
        text += `*/\r`

        // 填充行头的空格
        const whitespace = selectionLine.firstNonWhitespaceCharacterIndex
        const padSpaceStr = ' '.repeat(whitespace)
        text = text.replace(/\r/g, `\r${padSpaceStr} `)
        text = `${padSpaceStr}${text}`
        text = text.slice(0, text.length - whitespace - 1)

        // 插入注释
        editBuilder.insert(insertPosition, text)
      })
  }))
}