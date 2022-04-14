// const acorn = require('acorn');
import { parse } from '@typescript-eslint/typescript-estree';
// const walk = require('walk').walk;

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
   // const ast = acorn.parse(str, { ecmaVersion: 2020, sourceType: 'module' });
   const text = fillSymbolStr(str)
   console.log(text)
    parse(text, {
        loc: true,
        range: true,
    }); 

    
    return {

    }
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