import {
    window,
    Range,
    Position
  } from 'vscode'
export function hasComments (allStr:string,node:any):boolean {
    const editor = window.activeTextEditor
    if (!editor) {
        return false
    }

    // 获取当前整个一行的代码
    const range = new Range(
        new Position(node.loc.start.line-2, 0),
        new Position(node.loc.start.line-1, 0)
    )

    // 获取范围的内容
    let text = editor.document.getText(range).trim()

    /**
     * 注释的可能规则
     * //开头
     * ** *\/结尾
     */
    if(/^\/\//.test(text)){
        return true
    }
    if(/\*\/$/.test(text)){
        return true
    }
    return false
}