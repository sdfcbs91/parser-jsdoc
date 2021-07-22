import * as vscode from 'vscode'

import {getFuncText} from '../comm/parsing';

/**
 * initJSDoc 把当前文件下所有的函数进行一次函数注释
 * @param {*} context vscode插件上下文
 */

// 定义匹配规则
// jsdoc文档规则 
// /**[one or more chars]*/ => /\/\*\*[\s\S]+?\*\//g
// pre

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

const exportRegStr = `export`

module.exports = function(context:vscode.ExtensionContext){
  

  /**
   * 1.获取带有 注解+函数
   * 2.获取注释中的纯函数起始位置 - 用来标记不用添加注释
   * 2.获取所有的函数
   * 3.排除掉规范注解的函数，对剩下没有规范注解的函数进行注释
   * 4.把新内容进行写入替换
   */
    const editor = vscode.window.activeTextEditor
   

    
    
    if (!editor) {
      return
    }
    let allText = editor.document.getText();

    let indexArr = getMatchArr(allText)

    
    //以倒序方式进行插入函数注释
    for(let i= indexArr.length-1;i>-1;i--){
      let indexObj = indexArr[i]
      let tmpText = getFuncText(indexObj.text);

      // 拿该次的正则对象进行一次文字内容的注释的替换
      // repalce的回调参数中,第0个肯定是全匹配
      allText = allText.replace(indexObj.regObj,function(str){
        let index = getReplaceNumber(arguments)
        console.log(indexObj.text)       
        if(index === indexObj.startIndex){
          return tmpText + str
        }
        return str
      })

    }
    
    editor.edit(editBuilder => {
      // 从开始到结束，全量替换
      const end = new vscode.Position(editor.document.lineCount + 1, 0);
      
      editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), end), allText);
    });
    vscode.window.showInformationMessage('Documentation comments are added!\r\n文档注释完成添加！');
}

/**
 * 根据文本获取匹配到的函数数组
 * @param str 
 */
function getMatchArr(str:string){
  let text = str;
  
  let regList = [
    // function somebody():any{}
    `function${sRegStr}${funNameRegStr}${sRegStr}${paramRegStr}${sRegStr}${resRegStrOr}`,
    // [const,left,var] somebody = function():any{}
    `${stateRegStr}${sRegStr}${funNameRegStr}${sRegStr}=${sRegStr}function${sRegStr}${paramRegStr}${sRegStr}${resRegStrOr}`,
    // [const,left,var] somebody = ():any=>{}
    `${stateRegStr}${sRegStr}${funNameRegStr}${sRegStr}=${sRegStr}${paramRegStr}${sRegStr}${resRegStrOr}=>`,

    // export function somebody():any{}
    `${exportRegStr}${sRegStr}function${sRegStr}${funNameRegStr}${sRegStr}${paramRegStr}${sRegStr}${resRegStrOr}`,
    // export [const,left,var] somebody = function():any{}
    `${exportRegStr}${sRegStr}${stateRegStr}${sRegStr}${funNameRegStr}${sRegStr}=${sRegStr}function${sRegStr}${paramRegStr}${sRegStr}${resRegStrOr}`,
    // export [const,left,var] somebody = ():any=>{}
    `${exportRegStr}${sRegStr}${stateRegStr}${sRegStr}${funNameRegStr}${sRegStr}=${sRegStr}${paramRegStr}${sRegStr}${resRegStrOr}=>`,

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

  // 纯注释 规则
  let jsdReg = new RegExp(jsDocRegStr,'g')
  // 注释  
  let jsddReg = new RegExp(/(\/\/[^\n^\r]*\n)|(\/\/[^\n^\r]*\r\n)/,'g') 
  // 匹配到的注释数组
  let jsdocRegArr = jsdReg.exec(str);
  // 匹配到的注释数组 //
  let jsdocReg1Arr = jsddReg.exec(str)
  console.error(jsdocReg1Arr,'111')
  // 记录注释的起始结束位
  const jsdocArr:any = []

  while(jsdocRegArr){
    jsdocArr.push({
      startIndex:jsdocRegArr.index,
        endIndex:jsdReg.lastIndex
    })
    jsdocRegArr = jsdReg.exec(text);
  }

  const areaBeginAndEnd: any = []
  // 记录已经有过注释的函数起始结束位
  let annoIndexArr:any = []
  // 记录所有函数的起始结束位
  const indexArr:{startIndex:number,endIndex:number,text:string,regObj:RegExp}[] = []
  // 获取带注释//

    // let array = []
  while(jsdocReg1Arr){
    areaBeginAndEnd.push({
      startIndex: jsdocReg1Arr.index,
      endIndex: jsddReg.lastIndex === undefined?text.length:jsddReg.lastIndex
    })
    jsdocReg1Arr = jsddReg.exec(text);
  }
  
  
  regList.forEach(regStr=>{
    //const annotatedArr = allText.match(new RegExp(jsDocRegStr+sRegStr+regStr,'g'));
    // console.log(regStr)
    // 获取带有规范注解的函数
    
    // 注释+函数
    let annotatedReg = new RegExp(jsDocRegStr+sRegStr+regStr,'g')
    // 所有的函数
    let annoFuncReg = new RegExp(regStr,'g')
    // 函数 - 匹配文中所有的函数
    let funcReg = new RegExp(regStr,'g')

    let annotatedArr = annotatedReg.exec(text);
    // index , last
    // 由于exec的特性，每次会找到最邻近的一个
    while(annotatedArr){
      // 匹配后，重置一次顺序
      annoFuncReg.lastIndex = 0

      // 获取到注解到函数位置
      // 每次遍历到最接近的一个
      let annoFuncArr = annoFuncReg.exec(annotatedArr[0])
      if(annoFuncArr){
        let annoFuncStartIndex = 0
        while(annoFuncArr){
          annoFuncStartIndex = annoFuncArr.index
          annoFuncArr = annoFuncReg.exec(annotatedArr[0])
        }
        // 标记已经添加过注释的位置
        annoIndexArr.push({
          // 文档位置+扫描内的函数位置
          startIndex:annotatedArr.index + annoFuncStartIndex,
          endIndex:annotatedReg.lastIndex
        })
      }
      annotatedArr = annotatedReg.exec(text);
    }
   
    // 匹配所有的函数
    let funcArr = funcReg.exec(text);
    while(funcArr){
      let startIndex = funcArr.index
      let endIndex = funcReg.lastIndex
      // 在注释文档内的函数不要进行注释
      // 判断改函数是否是在注释内
      let bool = false
      for(let i=0;i<jsdocArr.length;i++){
        // console.log('{startOdp}',jsdocArr[i])
        let inInterval = inNodeInterval(jsdocArr[i],{startIndex,endIndex})
        if(inInterval === true){
          bool = true
          break
        }
      }
      if(bool===true){
        funcArr = funcReg.exec(text);
        continue
      }
      indexArr.push({
        startIndex,
        // 匹配到的函数文本
        text:funcArr[0],
        regObj:funcReg,
        endIndex
      })
      funcArr = funcReg.exec(text);
    }
    
  })

  // 由于函数申明的规则存在覆盖性，故进行一次数组的数据冗余去除 - 函数被匹配到多个规则下时，取最长到那条规则为有效函数
  // 带有注释的函数其实无需排序除冗余,作为对比用到即可
  let tmpArr  = annoIndexArr.concat(areaBeginAndEnd);
  // console.log(text[175],'匹配到')
  annoIndexArr = tmpArr;
  // 进行一次排序 从小到大
  annoIndexArr.sort((l:any,r:any)=>{
    return l.startIndex - r.startIndex
  })
  // 如果起始点的位置在上一个节点起始->结尾区间,那么这个节点匹配规则进行删除
  for(let i=annoIndexArr.length-1;i>0;i--){
    let inInterval = inNodeInterval(annoIndexArr[i-1],annoIndexArr[i])
    // console.log(annoIndexArr[i], '当前节点',inInterval)
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
      //  console.log(getNodeByStartIndex(annoIndexArr,indexArr[i].startIndex), '当前节点')

    if(getNodeByStartIndex(annoIndexArr,indexArr[i].startIndex)>-1){
      indexArr.splice(i,1)
      continue
    }
    
    // for (let index = 0; index < annoIndexArr.length; index++) {
    //   const element = annoIndexArr[index];
    //   console.log(text.slice(element.startIndex,element.endIndex), '查看字符串')
    // }
    // console.log(text.slice(indexArr[i].startIndex,indexArr[i].endIndex),'查看函数体')
    console.log(getNodeByStartIndexFilter(annoIndexArr,indexArr[i].startIndex), '匹配数组长度')

    if(getNodeByStartIndexFilter(annoIndexArr,indexArr[i].startIndex)>-1){
      indexArr.splice(i,1)
      continue
    }else if(getNodeByStartIndexFilter(annoIndexArr,indexArr[i].startIndex)>-1){
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

  return indexArr
}

/**
 * 根据`startIndex`获取数组中对应的节点
 * @param {array}  nodes 数组节点
 * @param {number} startIndex 数字
 * @returns {number}
 */
function getNodeByStartIndexFilter(nodes:[{startIndex:number,endIndex:number}],startIndex:number){
  for(let i=0;i<nodes.length;i++){
    let item = nodes[i]
    if(item.startIndex < startIndex && item.endIndex > startIndex){
      return i
    }
  }
  return -1
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
    if(nodes[i].startIndex === startIndex ){
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

/**
 * 在replace的回调函数的参数中获取index
 */
function getReplaceNumber(args:any):number{
  let num = -1
  for(let i=0;i<args.length;i++){
    if(typeof args[i] === 'number'){
      return args[i]
    }
  }
  return num
}
