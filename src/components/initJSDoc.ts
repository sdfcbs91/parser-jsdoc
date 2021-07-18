import * as vscode from 'vscode'
import {getFormatDate} from '../comm/date';
import {getDocText} from '../comm/parsing';

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
    // const resRegStrOr = `\\s*(:\\w+)*`
    const resRegStrOr = `\\s*(:(\\w|\\[|\\]|\\{|\\}|\\:|\\"|\\')+)*`
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
      `function${sRegStr}${funNameRegStr}${sRegStr}${paramRegStr}${sRegStr}${resRegStrOr}`,
      // [const,left,var] somebody = function():any{}
      `${stateRegStr}${sRegStr}${funNameRegStr}${sRegStr}=${sRegStr}function${sRegStr}${paramRegStr}${sRegStr}${resRegStrOr}`,
      // [const,left,var] somebody = ():any=>{}
      `${stateRegStr}${sRegStr}${funNameRegStr}${sRegStr}=${sRegStr}${paramRegStr}${sRegStr}${resRegStrOr}=>`,
      // somebody():any{} 取消掉该规则，与 if(),then(),xx(){}等调用函数语法相撞
      //`${funNameRegStr}${sRegStr}${paramRegStr}${sRegStr}${resRegStrOr}${sRegStr}\\{`,
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

      // 由于exec的特性，每次会找到最邻近的一个
      while(annotatedArr){
        // 获取到注解到函数位置
        // 每次遍历到最接近的一个
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
        annotatedArr = annotatedReg.exec(allText);
      }

      // 匹配所有的函数
      let funcArr = funcReg.exec(allText);
      while(funcArr){
        indexArr.push({
          startIndex:funcArr.index,
          // 匹配到的函数文本
          text:funcArr[0],
          endIndex:funcReg.lastIndex
        })
        funcArr = funcReg.exec(allText);
      }
      
    })

    // 由于函数申明的规则存在覆盖性，故进行一次数组的数据冗余去除 - 函数被匹配到多个规则下时，取最长到那条规则为有效函数
    // 带有注释的函数其实无需排序除冗余,作为对比用到即可
    
    // 进行一次排序 从小到大
    annoIndexArr.sort((l:any,r:any)=>{
      return l.startIndex - r.startIndex
    })
    // 如果起始点的位置在上一个节点起始->结尾区间,那么这个节点匹配规则进行删除
    for(let i=annoIndexArr.length-1;i>0;i--){
      let inInterval = inNodeInterval(annoIndexArr[i-1],annoIndexArr[i])
      // 当前节点${i}在前一节的区间中，进行删除
      if(inInterval===true){
        annoIndexArr.splice(i,1)
      }
    }
    

    // 所有匹配到到函数组
    // 进行一次排序 从小到大
    indexArr.sort((l:any,r:any)=>{
      return l.startIndex - r.startIndex
    })
    // 如果起始点的位置在上一个节点起始->结尾区间,那么这个节点匹配规则进行删除
    for(let i=indexArr.length-1;i>-1;i--){
      // 如果在已注释到函数中，那么进行删除-不用加注释
      if(getNodeByStartIndex(annoIndexArr,indexArr[i].startIndex)>-1){
        indexArr.splice(i,1)
        continue
      }
      if(i>0){
        let inInterval = inNodeInterval(indexArr[i-1],indexArr[i])
        if(inInterval===true){
          indexArr.splice(i,1)
        }
      }
    }

    //以倒序方式进行插入函数注释
    for(let i= indexArr.length-1;i>-1;i--){
      getDocText(indexArr[i].text);

    }

    console.log(107,annoIndexArr)
    console.log(108,indexArr)
    // console.log(allText)
    // console.log(allText.split(/\n/g))
    // console.log(allText.split(/\r\n/g))
    // console.log(allText.split(/\r\n|\r/g))
     console.log(getFormatDate('YYYY-MM-DD',new Date()))
}

/**
 * 根据`startIndex`获取数组中对应的节点
 * @param {array}  nodes 数组节点
 * @param {number} startIndex 数字
 * @returns {number}
 */
function getNodeByStartIndex(nodes:[{startIndex:number}],startIndex:number):number{
  let r = -1;
  for(let i = 0;i<nodes.length;i++){
    if(nodes[i].startIndex === startIndex){
      return i
    }
  }
  return r
}

/**
 * 进行两节点判断，判断nodeNext参数是否在nodePre参数的区间
 * @param {startIndex:number,endIndex:number} nodePre  数组中到上一个节点
 * @param {startIndex:number,endIndex:number} nodeNext 数组中到下一个节点
 * @returns {boolean}
 */
function inNodeInterval(nodePre:{startIndex:number,endIndex:number},nodeNext:{startIndex:number,endIndex:number}):boolean{
  if(nodeNext.startIndex<nodePre.endIndex && nodeNext.startIndex>nodePre.startIndex){
    return true
  }
  return false
}
