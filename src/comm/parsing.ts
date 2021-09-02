/**
 * 
 */
 import * as vscode from 'vscode'
 import {getFormatDate} from '../comm/date';

// 定义匹配规则
// 返回类型
// :any  \s*(:\w+)*
const resRegStrOr = `\\s*(:(\\w|\\[|\\]|\\{|\\}|\\:)+)*`
const resRegStr = `\\s*:(\\w|\\[|\\]|\\{|\\}|\\:)+`
// (param:xx,param:xx)
const paramRegStr = `(\\([^(^)]+\\))`
// ?:sombody[] 
//const paramEndReg = /[?]{0,1}\:(\s)*\w+(\[\])*/g
// ?:
//const paramTypeReg = /[?]{0,1}\:(\s)*/g 
// [{ 参数类型中可能包含符号
const typeSymbolRegStr = `[\\[\\{]{1}`
// [{ 参数类型中可能包含符号
const typeSymbolEndRegStr = `[\\]\\}]{1}`
// {xxx}格式的参数
const bigPranRegStr = `\\{[^\\}]*\\}`

/**
 * 
 * @param str str需要是函数的文字格式
 * @returns 
 */
 export function getFuncText(str:string):string{
    let text = ""
    // 
    let fJson = getFuncJson(str)
    text = '/**\r'
    text += `* 描述\r`

    // 作者
    const configuration = vscode.workspace.getConfiguration('jsdoc');
    const author = configuration.get('author') || ''
    author && (text += `* @author ${author}\r`)

    // 日期
    text += `* @date ${getFormatDate('YYYY-MM-DD',new Date())}\r`
    
    
    if(fJson !== null){
        // 参数
        fJson.params.forEach((par)=>{
            text += `* @param {${par.typeStr}} ${par.nameStr}\r`
        })
        
        // 返回值
        text += `* @returns {${fJson.resTypeStr || 'any'}}\r`
        text += `*/\r`
    } else{
        text += `*/\r`
    }  

    return text
 }

/**
 * 
 * @param str str需要是函数的文字格式
 * @returns 
 */
export function getFuncJson(str:string):{params:{nameStr: string,typeStr: string}[],resTypeStr:string}|null{
    // 定义字符串
    // 函数内所有的参数
    //let resParamStr = ''
    // 返回类型
    let resTypeStr = 'any'

    // 获取参数列表, 去除其中的空格与回车
    const m = str.match(new RegExp(paramRegStr+resRegStrOr,'g'))

    if(!m) {
        const res = str.match(new RegExp(resRegStr,'g'))
        // 判断有没有返回类型,如果有返回类型进行获取并返回
        if(res){
            return {
                params:[],
                resTypeStr:res[0].replace(':','')
            }
        }else{
            return null
        }
    }
    // 获取(xxx,xxx)形式的参数
    const paramArr = m[0].match(new RegExp(paramRegStr))
    if(!paramArr){
        return null
    }
    // 如果有类型返回，那么就获取并设置resTypeStr
    if(m[0].trim().length>paramArr[0].trim().length){
        let resLen = m[0].length;
        // 类型可能是{结尾,进行排除
        if(m[0].match(new RegExp(/\{$/))){
            resLen = resLen-1
        }

        // 获取到 :xxx
        resTypeStr = m[0].substring(paramArr[0].length,resLen).trim()
        // 去除:符号
        resTypeStr = resTypeStr.substring(1,resTypeStr.length)
    }
    // 获取具体的参数列表
    let params = getParamArr(paramArr[0])
    return {
        params,
        resTypeStr
    }
}

/**
 * 
 * @param str str需要是函数的文字格式 xxx()
 * @returns {{nameStr,typeStr}[]}
 */
 export function getParamArr(str:string):{nameStr: string, typeStr: string}[]{
     let paramArr = []
     let colonReg = /(\?)?\:/g
     let commaReg = /\,/g
     const bigPranReg = new RegExp(bigPranRegStr,'g')     

     //去掉可能的()
     str = str.replace(/^\(/,'').replace(/\)$/,'')
     // 每次遍历到最接近的一个:
     // xxx:{xxx},xxx:xxx
     

     
     // 临时字符串 - 用于在遍历匹配中时刻保存剩有的字符串
     let nameStr = ''
     let typeStr = ''
     // 遍历到的字符串顺序位置
     let index =0
     let bool = true
     // :往后遍历
     let nextColonReg = true
     // ,往后遍历
     let nextCommaColonReg = true
     let colonArr = null
     let commaArr = null
     let prantArr = null
     while(bool){
        // :
        if(nextColonReg === true){
            colonArr = colonReg.exec(str);
        }
        // ,
        if(nextCommaColonReg === true){
            commaArr = commaReg.exec(str);
        }
        //是否存在, 存在,再进行判断 ,:的前后顺序
        if(commaArr){
            if(colonArr){
                // 如果,在:之前 那么就证明前一次的参数没有定义类型   xxx,xxx:xxx
                if(commaArr.index < colonArr.index){
                    nameStr = str.substring(index,commaArr.index)
                    typeStr = 'any'
                    index = commaArr.index+1
                    nextColonReg = false
                }else{
                    nextColonReg = true
                    // :在,之前 证明该次的参数有类型定义
                    nameStr = str.substring(index,colonArr.index)

                    // 判断 :xx, 中是否含有 [ { 的复杂结构符号
                    let middleStr = str.substring(colonArr.index+colonArr[0].length,commaArr.index)
                    
                    let isSymbol = isSymbolModel(middleStr)
                    // 如果含有复杂结构 获取得到复杂结构开始位置和结束位置
                    if(isSymbol === true){
                       
                        // 字符串没有变动过，只是游标位数在变动 故传入游标到末尾的字符串进去获取复杂结构
                        let tmpStr = str.substring(index,str.length)
                        // 处理复杂结构                        
                        let colonJson = handelColonModel(tmpStr)
                        if(colonJson){
                            typeStr = colonJson.typeStr
                            // 如果结尾的复杂结构位数大于了下一个, 那么以复杂结构的尾数为准
                            const colonIndex = colonJson.index + index
                            index = colonIndex>commaArr.index?colonIndex:commaArr.index+1
                            colonReg.lastIndex = index
                            commaReg.lastIndex = index
                        }else{
                           // 解析有误 退出
                            bool = false
                            continue
                        }
                       
                    }else{
                        // 没有复杂结构 则为普通的变量类型参数
                        typeStr = middleStr
                        index = commaArr.index
                    }

                }
                // 可能是 ?:
                if(colonArr[0].length>1){
                    nameStr =  `[${nameStr}]`
                }
            }else{
                // 存在逗号，但不存在: 证明只是类型定义，返回参数名 any 即可
                // 匹配可能的{xxx}
                prantArr = bigPranReg.exec(str);
                if(prantArr){
                    let prantEnd = prantArr.index+prantArr[0].length
                    let endIndex = prantEnd>commaArr.index?prantEnd:commaArr.index
                    nameStr = "obj" 
                    typeStr = str.substring(index,endIndex)
                    index = endIndex+1
                }else if(index<commaArr.index){
                    nameStr = str.substring(index,commaArr.index)
                    
                    index = commaArr.index+1
                    typeStr = 'any'
                }else{
                    // 如果逻辑进行到这里，那么表示,还在{}之前，继续进行while循环
                    continue
                }
                
                // :已经没有意义继续匹配
                nextColonReg = false
            }
            
        }else{
            //如果没有, 则表示只有一个参数 执行完就退出循环
            bool = false
            // 如果存在: 
            if(colonArr){
                nameStr = str.substring(index,colonArr.index).trim()

                // 判断 :xx, 中是否含有 [ { 的复杂结构符号
                let middleStr = str.substring(colonArr.index+colonArr[0].length,str.length)
                let isSymbol = isSymbolModel(middleStr)
                // 是否是复杂结构
                if(isSymbol === true){
                    //获取复杂结构
                    // 字符串没有变动过，只是游标位数在变动 故传入游标到末尾的字符串进去获取复杂结构
                    let tmpStr = str.substring(index,str.length)
                    // 处理复杂结构                        
                    let colonJson = handelColonModel(tmpStr)
                    if(colonJson){
                        typeStr = colonJson.typeStr
                        
                        index += colonJson.index
                        colonReg.lastIndex = index
                        commaReg.lastIndex = index
                    }else{
                       
                        bool = false
                        continue
                    }
                    
                }else{
                    typeStr = middleStr
                }
                // 可能是 ?:
                if(colonArr[0].length>1){
                    nameStr =  `[${nameStr}]`
                }
            }else{
                nameStr = index>=0? str.substring(index, str.length): str;
                typeStr = 'any'
            }
            
        }

        if(nameStr.length>0){
            paramArr.push({
                nameStr,
                typeStr
            })
        }

    }
     
    return paramArr
 }


  /**
  * 获取最近的复杂结构(数组|json)的开始位置和结束位置
  * 
  */
//    export function getClxStruct(str:string,arr = []):never[]{
//     let patchStr = str
//     const len = patchStr.length
//     let index = 0

//     while(index<len){
//         let matchJson = matchClxStruct(patchStr)
//         if(matchJson){

//         }
//     }
//   }


 /**
  * 获取最近的复杂结构(数组|json)的开始位置和结束位置
  * 
  */
  export function matchClxStruct(str:string):any{
      // :开始的位置
    const startColonIndex =  new RegExp(/\:/,'g').exec(str)?.index||null
    const typeSymbolReg = new RegExp(typeSymbolRegStr,'g')
    const typeSymbolEndReg = new RegExp(typeSymbolEndRegStr,'g')
    /* 根据闭合关系,设置得出规则：以{[开始后，得到的闭合]}数等于开始数，那么就证明该结构申明结束。
     * 1.获取 最接近{[开始的位置 标记num+1
     * 2.获取 最接近]}结尾的位置 标记num-1
     * 3.直到num = 0,那么证明该结构申明结束了
     * 4.得到累计遍历到的位置
     * 返回 这个区间段和开始结束位置信息
     */

    // 起始位置数组
    let typeSymbolRegArr = null 
    
    // 结束位置数组
    let typeSymbolEndRegArr = null
    
    
    // 数字标记 起始位置
    let firstStart = -1 
    
    // 用来存放对应的 最终符合条件的闭合位置
    let endIndex = -1

    // 符号的闭合标记值  
    let num = 0
    let bool = true

    // // 查到下一个开启 - 第二个开启位置
    // let tmpTypeSymbolRegArr = typeSymbolReg.exec(str)

    // // 目的 为了至少匹配一次 开合{  结束},所以拿第二个开启与关闭进行判断 num=1
    // if(tmpTypeSymbolRegArr){
    //     typeSymbolRegArr = tmpTypeSymbolRegArr
    //     num++
    // }

    while(num>-1 && bool){
        if(firstStart === -1 || endIndex === -1){ 
            typeSymbolRegArr = typeSymbolReg.exec(str)
            typeSymbolEndRegArr = typeSymbolEndReg.exec(str)
            // 结构有误，返回空信息
            if(typeSymbolRegArr && typeSymbolRegArr.index){
                firstStart = typeSymbolRegArr.index
            }else{
                bool = false
                continue
            }

            if(typeSymbolEndRegArr && typeSymbolEndRegArr.index){
                endIndex = typeSymbolEndRegArr.index
            }else{
                bool = false
                continue
            }
        }
        

        // 如果还有开启的，跟闭合进行位置比较
        // 如果本身的格式存在错误，那么匹配也就没有意义了  进行num-- 退出循环
        if(typeSymbolRegArr && typeSymbolEndRegArr){
            // 如果开启的位置在闭合位置的后面 那么判断当前是不是可以正常结束了。
            if(typeSymbolRegArr.index > typeSymbolEndRegArr.index){
               
                // 因为开启的符号在结束符号之后，所以多进行了一次匹配 所以要给num+1
                if(num ===1){
                    endIndex = typeSymbolEndRegArr.index+1

                    //存在{xxxx}[] [][]的申明方式
                    let nextStr = str.substring(endIndex,str.length)
                    let tmpStr = nextStr.trim()
                    let tmpReg = /^\[\s*\]/
                    let arr = tmpReg.exec(tmpStr)
                    if(arr){
                        tmpReg.lastIndex = 0
                        arr = /\[\s*\]/.exec(nextStr)
                        if(arr){
                            endIndex += arr.index+arr[0].length
                        }
                    }
                    // 符合条件进行结束标记
                    num = -1
                    continue
                }
                // 查找下一个闭合点
                let tmpTypeSymbolEndRegArr = typeSymbolEndReg.exec(str)
                if(tmpTypeSymbolEndRegArr && num>0){
                    typeSymbolEndRegArr = tmpTypeSymbolEndRegArr
                    num--
                }
                
            }else{
                //str = str.substring(typeSymbolRegArr.index+1,str.length)
                //typeSymbolReg.lastIndex = 0
                // 如果开启的位置在闭合位置（首次循环是找到的第一个结束符）的前面 那么继续查找下一个开启点位置
                let tmpTypeSymbolRegArr = typeSymbolReg.exec(str)
                if(tmpTypeSymbolRegArr && tmpTypeSymbolRegArr.index>typeSymbolRegArr.index){
                    typeSymbolRegArr = tmpTypeSymbolRegArr
                    num ++
                }else{
                    // 开启的位置在闭合位置的前面
                    if(num ===0){
                        endIndex = typeSymbolEndRegArr.index + 1
                        num = -1
                        continue

                    }
                    // num--
                    // 查找下一个闭合点
                    let tmpTypeSymbolEndRegArr = typeSymbolEndReg.exec(str)
                    if(tmpTypeSymbolEndRegArr && num>0){
                        typeSymbolEndRegArr = tmpTypeSymbolEndRegArr
                        num--
                        continue
                    }
                    // 结构异常 返回null
                    bool = false
                    continue
                }
                
            }
        }else{
            num=-1
        }
    }

    // 结构有误，返回空信息
    if(bool === false){
        return null
    }

    // end为匹配到的最后符合参数规则的位数
    // 还需要给外层提供一个 符合参数位数后的最近,的位置 如果没有, 那么则返回end
    let fullEnd = endIndex
    // let nextStr = str.substring(fullEnd,str.length)
    // let nextCommaReg = /^\,/g
    // let nextArr = nextCommaReg.exec(nextStr.trim())
    
    
    // if(nextArr){
    //     nextCommaReg.lastIndex = 0
    //     fullEnd += nextCommaReg.exec(nextStr)?.index||1
    // }

    //如果后面的字符串有 , 那么获取位置并加上
    let nextIndex = getFirstCommaIndex(str.substring(fullEnd,str.length))
    if(nextIndex!==null){
        fullEnd += nextIndex+1
    }

    // :总会在{之前
    if(startColonIndex!== null && firstStart>startColonIndex){
        firstStart = startColonIndex+1
    }

    return {
        fullText:str.substring(0,endIndex),
        paramText:str.substring(firstStart,endIndex),
        start:firstStart,
        end:endIndex,
        fullEnd
    }

  }

  /**
   * 返回最字符串中第一个,的位置
   */
  function getFirstCommaIndex(str:string){
    let commaReg = /^\,/g
    let nextArr = commaReg.exec(str.trim())
    
    //如果后面的字符串有 , 那么获取位置并加上
    if(nextArr){
        commaReg.lastIndex = 0
        nextArr = commaReg.exec(str)
        if(nextArr){
            return nextArr.index
        }
    }
    return null
}

/**
 * 判断是否含有复杂结构
 */
function isSymbolModel(str:string):boolean{
    let typeSymbolReg = new RegExp(typeSymbolRegStr,'g')
    let typeSymbolArr = typeSymbolReg.exec(str)
    if(typeSymbolArr){
        return true
    }
    return false
}

/**
 * 处理 :xxx 结构
 */
function handelColonModel(str:string):any{
    let cplStructJson = matchClxStruct(str)
    // 获取到了复杂结构 进行下一个参数继续获取
    if(cplStructJson){
        return {
            typeStr : cplStructJson.paramText,
            index : cplStructJson.fullEnd
        }
        
    }else{
        //没有获取到复杂结构 证明解析有误,那么继续解析也没有意义 进行退出
        return null
    }

}
