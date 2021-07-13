import * as vscode from 'vscode'
import {getFormatDate} from '../date';

/**
 * initJSDoc 把当前文件下所有的函数进行一次函数注释
 * @param {*} context vscode插件上下文
 */
module.exports = function(context:vscode.ExtensionContext){
  

  /**
   * 1.获取带有 注解+函数
   * 2.获取注释中的纯函数起始位置 - 用来标记不用添加注释
   * 2.获取所有的函数
   * 3.排除掉规范注解的函数，对剩下没有规范注解的函数进行注释
   * 4.把新内容进行写入替换
   */
    const editor = vscode.window.activeTextEditor
    // 定义匹配规则

    // jsdoc文档规则 
    // /**[one or more chars]*/ => /\/\*\*[\s\S]+?\*\//g
    const jsDocRegStr = `\\/\\*\\*[\\s\\S]+?\\*\\/`
    //返回类型
    // :any  \s*(:\w+)*
    const resRegStr = `\\s*(:\\w+)*`
    // 空格
    const sRegStr = `\\s*`
    // 参数 
    // (xx)
    const paramRegStr =  `\\([^(]*\\)`
    // 函数名
    // somebody
    const funNameRegStr =  `\\w+`
    // 声明
    // left const var
    const stateRegStr = `(const|left|var)?`
       
    let regList = [
      // function somebody():any{}
      `function${sRegStr}${funNameRegStr}${sRegStr}${paramRegStr}${sRegStr}${resRegStr}`,
      // [const,left,var] somebody = function():any{}
      `${stateRegStr}${sRegStr}${funNameRegStr}${sRegStr}=${sRegStr}function${sRegStr}${paramRegStr}${sRegStr}${resRegStr}`,
      // [const,left,var] somebody = ():any=>{}
      `${stateRegStr}${sRegStr}${funNameRegStr}${sRegStr}=${sRegStr}${paramRegStr}${sRegStr}${resRegStr}=>`,
      // somebody():any{}
      `${funNameRegStr}${sRegStr}${paramRegStr}${sRegStr}${resRegStr}${sRegStr}\\{`,
      // module.exports = function () {}
      `module.exports${sRegStr}=${sRegStr}function${sRegStr}${paramRegStr}`,
      // module.exports = () => {}
      `module.exports${sRegStr}=${sRegStr}${paramRegStr}${sRegStr}=>`,
      // exports.somebody = function () {}
      `exports.${funNameRegStr}${sRegStr}=${sRegStr}function${sRegStr}${paramRegStr}`,
      // exports.somebody = () => {}
      `exports.${funNameRegStr}${sRegStr}=${sRegStr}${paramRegStr}=>`,
    ]
    
    if (!editor) {
      return
    }
    let allText = editor.document.getText();
    // 记录已经有过标记的函数起始位
    const annoIndexArr:any = []
    // 记录所有函数的起始位
    const indexArr:any = []

    regList.forEach(regStr=>{
      //const annotatedArr = allText.match(new RegExp(jsDocRegStr+sRegStr+regStr,'g'));

      // 获取带有规范注解的函数
      // 注释+函数
      let annotatedReg = new RegExp(jsDocRegStr+sRegStr+regStr,'g')
      // 去除注释的函数
      let annoFuncReg = new RegExp(regStr,'g')
      // 函数 - 匹配文中所有的函数
      let funcReg = new RegExp(regStr,'g')

      let annotatedArr = annotatedReg.exec(allText);
      console.log(83,annotatedArr)
      console.log(84,regStr)
      // 由于exec的特性，每次会找到最邻近的一个
      while(annotatedArr){
        // 获取到注解到函数位置
        // 每次遍历到最接近到一个
        let annoFuncArr = annoFuncReg.exec(annotatedArr[0]);
        if(annoFuncArr){
          // 匹配后，重置一次顺序
          annoFuncReg.lastIndex = 0
          // 标记已经添加过注释的位置
          annoIndexArr.push({
            // 文档位置+扫描内的函数位置
            startIndex:annotatedArr.index + annoFuncArr.index,
            endIndex:annotatedReg.lastIndex
          })
        }
        //console.log(78,annotatedArr[0])
        //console.log(100,regStr)
        // console.log(79,annotatedArr)
        //console.log(82,annoFuncArr)
        annotatedArr = annotatedReg.exec(allText);
      }

      // 匹配所有的函数
      let funcArr = funcReg.exec(allText);
      while(funcArr){
        indexArr.push({
          startIndex:funcArr.index,
          endIndex:funcReg.lastIndex
        })
        funcArr = funcReg.exec(allText);
      }
      
    })

    // 由于函数申明的规则存在覆盖性，故进行一次数组的数据冗余去除 - 函数被匹配到多个规则下时，取最长到那条规则为有效函数
    annoIndexArr.sort((l:any,r:any)=>{
      return l.startIndex - r.startIndex
    })
    for(let i=1;i<annoIndexArr.length;i++){
      
    }
    indexArr.sort((l:any,r:any)=>{
      return l.startIndex - r.startIndex
    })

    console.log(107,annoIndexArr)
    console.log(108,indexArr)
    // console.log(allText)
    // console.log(allText.split(/\n/g))
    // console.log(allText.split(/\r\n/g))
    // console.log(allText.split(/\r\n|\r/g))
     console.log(getFormatDate('YYYY-MM-DD',new Date()))
}
