import { parse } from '@typescript-eslint/typescript-estree';

const lSymbolReg = '(\\{|\\[|\\()'
const rSymbolReg = '(\\}|\\]|\\))'

const revertSymbolMap = new Map();
revertSymbolMap.set('{','}')
revertSymbolMap.set('[',']')
revertSymbolMap.set('(',')')
revertSymbolMap.set('}','{')
revertSymbolMap.set(']','[')
revertSymbolMap.set(')','(')


export const getJsInfo=(str:string)=>{
    // 把可能断句的代码补齐括号
    const text = fillSymbolStr(str)
  
    const ast:any = parseSelf(text, {
        loc: true,
        range: true,
    }); 

    const funAst = astTFunAst(ast,text)

    const funInfoArr = funArrAstText(funAst)
    
    return {
        funAst,funInfoArr
    }
} 

const parseSelf = (text:string,option:any):any=>{
    try{
        return parseBlock(text,option)
    }catch(error){
        // 尝试一次把对象内函数转成单一函数
        text = "function "+text.replace(/\:\s*function/g,'')
        return parseBlock(text,option)
    }
}

const parseBlock = (text:string,option:any):any=>{
    return parse(text, option); 
}

// 获取字符串解析的内容
const getSymbolStr = (reg:string,text:string):string=>{
    const r = new RegExp(reg,'g')
    let str = ""
    let index = 0
    while(index>-1){
        const info = r.exec(text);
        if(info === null){
            index = -1
            continue
        }
        str += info[0]
        
    }
    return str
}

// 补齐当前表达式缺少的括号
const fillSymbolStr = (text:string)=>{
    const lStr = getSymbolStr(lSymbolReg,text)
    const rStr = getSymbolStr(rSymbolReg,text)
    let newStr = text;
    if(rStr.length<lStr.length){
        // 获取去翻转后的内容
        const reverseStr = reverseString(reverseSymbol(lStr))
        for(let i = rStr.length;i<reverseStr.length;i++){
            newStr += reverseStr[i]
        }
    }
    return newStr
}

// 表达式括号取反
const reverseSymbol = (symbolStr:string):string=>{
    let newStr = ''
    for (let i = symbolStr.length - 1; i >= 0; i--) { 
        const str = revertSymbolMap.get(symbolStr[i])
        if(typeof str !== 'undefined'){
            newStr += str
        }
    }
    return newStr
}

// 字符串翻转
const reverseString = (str:string):string =>{
    let newStr = "";
 
    for (let i = str.length - 1; i >= 0; i--) { 
        newStr += str[i]; 
    }
   
    return newStr; 
}

// 解析ts的ast,拼凑成函数注释的ast
const astTFunAst = (ast:any,text:string)=>{
    const arr = []
    for(let i=0;i<ast.body.length;i++){
        const item = ast.body[i];
        // 普通函数
        if(item.type === 'FunctionDeclaration'){
            const tmp = {
                name:item.id.name,
                params:[] as any,
                returnText:''
            }
            arr.push(tmp)
            // params
            walkParams(item.params,text,(info:any)=>{
                tmp.params.push(info)
            })
            // returns
            if(item.returnType){
                const range = item.returnType.range
                tmp.returnText = text.substring(range[0]+1,range[1])
            }
            // 变量
        }else if(item.type === 'VariableDeclaration'){
            for(let j=0;j<item.declarations.length;j++){
                const fItem = item.declarations[j]
                
                if(fItem.init){
                    const sItem = fItem.init
                    // 箭头函数
                    if(sItem.type === 'ArrowFunctionExpression'){
                        const tmp = {
                            name:fItem.id.name,
                            params:[] as any,
                            returnText:''
                        }
                        arr.push(tmp)
                        walkParams(sItem.params,text,(info:any)=>{
                            tmp.params.push(info)
                        })
                        if(sItem.returnType){
                            const range = sItem.returnType.range
                            tmp.returnText = text.substring(range[0]+1,range[1])
                        }
                    }
                }
            }
        }
    }
    return {
        body:arr
    }
}

const walkParams = (params:any,text:string,call:Function)=>{
    for(let j=0;j<params.length;j++){
        const parm = params[j]
        if(parm.typeAnnotation){
            const range = parm.typeAnnotation.range
            parm.typeText = text.substring(range[0]+1,range[1])
        }
        if(call){
            call({
                typeText:parm.typeText||'',
                name:parm.name
            })
        }
    }
}

const funArrAstText = (funAst:any)=>{
    const arr = []
    for(let i =0;i<funAst.body.length;i++){
        const tmp = {
            params:'',
            returns:''
        }
        const item = funAst.body[i]
        let str = ""
        // params
        item.params.forEach((par:any)=>{
            let typeText = ""
            if(par.typeText){
                typeText = `{${par.typeText}} `
            }
            str += `* @param ${typeText}${par.name}\r`
        })
        tmp.params = str
        // returns
        tmp.returns = `${item.returnText}`
        arr.push(tmp)
    }
    return arr
}