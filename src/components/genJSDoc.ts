import { workspace, ExtensionContext, window, Range, Position } from "vscode";
import { getFormatDate } from "../comm/date";
import { getJsInfo } from "../comm/astParsing";

/**
 * addJSDoc 根据选中都函数参数，进行文档注释
 * @param {*} context vscode插件上下文
 */
module.exports = function (context: ExtensionContext) {
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }

  // 获取 selection 对象(其中包含当前选择的行与字符)
  const selection = editor.selection;

  // 获取全文
  const allText = editor.document.getText();

  // 获取当前整个一行的代码
  const range = new Range(
    new Position(selection.start.line, 0),
    new Position(selection.end.line + 1, 0)
  );

  // 获取选中的内容
  const selectionText = editor.document.getText(range);

  let text = "/**\r";
  text += `* desc\r`;

  // 作者
  const configuration = workspace.getConfiguration("jsdoc");
  const author = configuration.get("author") || "";
  author && (text += `* @author ${author}\r`);

  // 日期
  const dateFormat: string = configuration.get("dateformat") || "YYYY-MM-DD";
  text += `* @date ${getFormatDate(dateFormat, new Date())}\r`;

  // 选中内容的参数
  let arrText: any = [];
  let boolInfo = false;
  try {
    arrText = getJsInfo(allText, range, selectionText);
    if (arrText) {
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

  if (arrText && arrText.length > 0) {
    const info = arrText[0];
    // 参数
    text += info.params;
    // returns
    if (info.returns) {
      text += `* @returns { ${info.returns} }\r`;
    }
  } else {
    // 如果匹配到的内容长度小于1也返回false
    return false;
  }
  // 结尾
  text += `*/\r`;

  editor.edit((editBuilder) => {
    // 取上一行的末尾作为插入点
    const selectionLine = editor.document.lineAt(selection.start.line);
    const insertPosition = selectionLine.range.start;

    // 填充行头的空格
    const whitespace = selectionLine.firstNonWhitespaceCharacterIndex;
    const padSpaceStr = " ".repeat(whitespace);
    text = text.replace(/\r/g, `\r${padSpaceStr} `);
    text = `${padSpaceStr}${text}`;
    text = text.slice(0, text.length - whitespace - 1);

    // 插入注释
    editBuilder.insert(insertPosition, text);

    window.showInformationMessage("success", {
      modal: false,
    });
  });
};
