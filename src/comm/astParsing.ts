import { parse } from "@typescript-eslint/typescript-estree";

import { walk } from "./typeScriptWalk";

import { astParseNode, inNodeTypeArr, inParseNodeArr } from "./astParseNode";

import { Range } from "vscode";

const lSymbolReg = "(\\{|\\[|\\()";
const rSymbolReg = "(\\}|\\]|\\))";

const revertSymbolMap = new Map();
revertSymbolMap.set("{", "}");
revertSymbolMap.set("[", "]");
revertSymbolMap.set("(", ")");
revertSymbolMap.set("}", "{");
revertSymbolMap.set("]", "[");
revertSymbolMap.set(")", "(");

// node可能解析函数的类型
const inParseNodes = inParseNodeArr.concat(inNodeTypeArr);

interface nodeTextInfo {
  node: any;
  arr: Array<{ params: string; returns: string }>;
}

export const getLineInfo = (str: string) => {
  // 把可能断句的代码补齐括号
  const text = fillSymbolStr(str);

  const ast: any = parseSelf(text, {
    loc: true,
    range: true,
  });

  const arr = astParseNodes(ast, text);

  return astParseNodesText(arr);
};

export const getJsInfo = (
  allStr: string,
  range: Range,
  selectionText: string
) => {
  let info = null;
  const startLine = range.start.line + 1;
  const ast: any = parse(allStr, {
    loc: true,
    range: true,
    jsx: true,
    debugLevel: true,
  });

  // 首先在解析全文中获取内容
  try {
    walk(ast, {
      enter(opt: any) {
        const node = opt.node;
        if (startLine === node.loc.start.line) {
          info = astParseNode(node, allStr);

          // 存在同一行为不同类型的node节点
          if (info) {
            return false;
          }
        }
      },
    });
    if (info) {
      return astParseNodesText([info]);
    }
    return null;
  } catch (e) {
    // 如果全文环境存在问题,降级处理 进行具体选中内容解析
    return getLineInfo(selectionText);
  }
};

const parseSelf = (text: string, option: any): any => {
  try {
    return parseBlock(text, option);
  } catch (error) {
    // 尝试一次把对象内函数转成单一函数
    text = "function " + text.replace(/:\s*function/g, "");
    return parseBlock(text, option);
  }
};

const parseBlock = (text: string, option: any): any => {
  return parse(text, option);
};

// 获取字符串解析的内容
const getSymbolStr = (reg: string, text: string): string => {
  const r = new RegExp(reg, "g");
  let str = "";
  let index = 0;
  while (index > -1) {
    const info = r.exec(text);
    if (info === null) {
      index = -1;
      continue;
    }
    str += info[0];
  }
  return str;
};

// 补齐当前表达式缺少的括号
const fillSymbolStr = (text: string) => {
  const lStr = getSymbolStr(lSymbolReg, text);
  const rStr = getSymbolStr(rSymbolReg, text);
  let newStr = text;
  if (rStr.length < lStr.length) {
    // 获取去翻转后的内容
    const reverseStr = reverseString(reverseSymbol(lStr));
    for (let i = rStr.length; i < reverseStr.length; i++) {
      newStr += reverseStr[i];
    }
  }
  return newStr;
};

// 表达式括号取反
const reverseSymbol = (symbolStr: string): string => {
  let newStr = "";
  for (let i = symbolStr.length - 1; i >= 0; i--) {
    const str = revertSymbolMap.get(symbolStr[i]);
    if (typeof str !== "undefined") {
      newStr += str;
    }
  }
  return newStr;
};

// 字符串翻转
const reverseString = (str: string): string => {
  let newStr = "";

  for (let i = str.length - 1; i >= 0; i--) {
    newStr += str[i];
  }

  return newStr;
};

// 解析ts的ast,拼凑成函数注释的ast
const astParseNodes = (ast: any, text: string) => {
  const arr = [];
  for (let i = 0; i < ast.body.length; i++) {
    const item = ast.body[i];
    const info = astParseNode(item, text);
    if (info) {
      arr.push(info);
    }
  }
  return arr;
};

const astParseNodesText = (
  arr: any
): Array<{ params: string; returns: string }> => {
  const arrText = [];
  for (let i = 0; i < arr.length; i++) {
    const tmp = {
      params: "",
      returns: "",
    };
    const item = arr[i];
    let str = "";
    // params
    item.params.forEach((par: any) => {
      let typeText = "";
      if (par.typeText) {
        typeText = `{${par.typeText}} `;
      }
      str += `* @param ${typeText}${par.name}\r`;
    });
    tmp.params = str;
    // returns
    tmp.returns = `${item.returnText}`;
    arrText.push(tmp);
  }
  return arrText;
};

export const getJsArr = (allStr: string) => {
  const nodesTextInfo: Array<nodeTextInfo> = [];
  const indexMap: any = {};

  const ast: any = parse(allStr, {
    loc: true,
    range: true,
    jsx: true,
    debugLevel: true,
  });
  // 遍历全文的ast,如果为函数，则进行注释的添加
  try {
    walk(ast, {
      enter(opt: any) {
        const node = opt.node;
        if (inParseNodes.indexOf(node.type) > -1) {
          // node去重
          if (indexMap[node.loc.start.line]) {
            return;
          }
          const info = astParseNode(node, allStr);
          if (info) {
            nodesTextInfo.push({
              node,
              arr: astParseNodesText([info]),
            });
            indexMap[node.loc.start.line] = true;
          }
        }
      },
    });
  } catch (e) {
    // 如果全文环境存在问题,那么停止解析
    return null;
  }
  return nodesTextInfo;
};
