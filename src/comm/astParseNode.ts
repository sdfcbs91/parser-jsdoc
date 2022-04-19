export const astParseNode = (node: any, text: string):any => {
    // 普通函数 类声明的内置函数
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
        const tmp = {
            name: node.id?node.id.name:'',
            params: [] as any,
            returnText: ''
        }

        // params
        walkParams(node.params, text, (info: any) => {
            tmp.params.push(info)
        })
        // returns
        if (node.returnType) {
            const range = node.returnType.range
            tmp.returnText = text.substring(range[0] + 1, range[1])
        }
        return tmp
        // 变量
    } else if (node.type === 'VariableDeclaration') {
        for (let j = 0; j < node.declarations.length; j++) {
            const fItem = node.declarations[j]

            if (fItem.init) {
                const sItem = fItem.init
                // 箭头函数
                if (sItem.type === 'ArrowFunctionExpression') {
                    const tmp = {
                        name: fItem.id.name,
                        params: [] as any,
                        returnText: ''
                    }

                    walkParams(sItem.params, text, (info: any) => {
                        tmp.params.push(info)
                    })
                    if (sItem.returnType) {
                        const range = sItem.returnType.range
                        tmp.returnText = text.substring(range[0] + 1, range[1])
                    }
                    return tmp
                }
            }
        }
        // 对象方法
    } else if(node.type === 'MethodDefinition'){
        if(node.value){
            return astParseNode(node.value,text)
        }
        // 如果是导出
    }else if(node.type === 'ExportNamedDeclaration'){
        if(node.declaration){
            // 解析导出的内容
            return astParseNode(node.declaration,text)
        }
        // 对象属性
    }else if(node.type === 'ExpressionStatement'){
        if(node.expression){
            // 解析表达式
            return astParseNode(node.expression,text)
        }
        // 赋值表达式
    }else if(node.type === 'AssignmentExpression'){
        // 解析右侧
        if(node.right){
            return astParseNode(node.right,text)
        }
    }
    return null
}

// 生成params参数
const walkParams = (params: any, text: string, call: Function) => {
    for (let j = 0; j < params.length; j++) {
        const parm = params[j]
        if (parm.typeAnnotation) {
            const range = parm.typeAnnotation.range
            parm.typeText = text.substring(range[0] + 1, range[1])
        }
        if (call) {
            call({
                typeText: parm.typeText || '',
                name: parm.name
            })
        }
    }
}
