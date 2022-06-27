import { workspace, ExtensionContext, window } from "vscode";

import { getFormatDate } from "../comm/date";

import { getJsArr } from "../comm/astParsing";

import { hasComments } from "../comm/rangeDoc";

/**
 * initJSDoc 把当前文件下所有的函数进行一次函数注释
 * @param {*} context vscode插件上下文
 */
module.exports = function (context: ExtensionContext) {
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }

  // 获取全文
  const allText = editor.document.getText();

  let text = "/**\r";
  text += `* desc\r`;

  // 作者
  const configuration = workspace.getConfiguration("jsdoc");
  const author = configuration.get("author") || "";
  author && (text += `* @author ${author}\r`);

  // 日期
  text += `* @date ${getFormatDate("YYYY-MM-DD", new Date())}\r`;

  let arrInfo: any = [];
  let boolInfo = false;

  try {
    arrInfo = getJsArr(allText);
    if (arrInfo) {
      boolInfo = true;
    }
  } catch (error) {
    boolInfo = false;
  }

  if (boolInfo === false) {
    window.showErrorMessage("sorry, syntax parsing error !", {
      modal: false,
    });
    return false;
  }

  if (arrInfo) {
    editor.edit((editBuilder) => {
      //以倒序方式进行插入函数注释
      for (let i = arrInfo.length - 1; i > -1; i--) {
        const node = arrInfo[i].node;
        const arrText = arrInfo[i].arr;
        if (!arrText || arrText.length < 1) {
          continue;
        }
        // 判断节点是否已被注释，如果被注释 则不再注释
        if (hasComments(allText, node)) {
          continue;
        }
        let str = text;

        const info = arrText[0];
        // 参数
        str += info.params;
        // returns
        if (info.returns) {
          str += `* @returns {${info.returns}}\r`;
        }

        // 还差补齐前空格
        const selectionLine = editor.document.lineAt(node.loc.start.line - 1);
        const insertPosition = selectionLine.range.start;

        // 填充行头的空格
        const whitespace = selectionLine.firstNonWhitespaceCharacterIndex;
        const padSpaceStr = " ".repeat(whitespace);
        str = str.replace(/\r/g, `\r${padSpaceStr} `);
        str = `${padSpaceStr}${str}`;

        // 结尾
        str += `*/\r`;

        // 插入注释
        editBuilder.insert(insertPosition, str);
      }
      window.showInformationMessage("success", {
        modal: false,
      });
    });
  }
};
