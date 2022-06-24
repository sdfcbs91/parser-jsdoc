 // 普通函数 类声明的内置函数 箭头函数
const inNodeTypeArr = ['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'];

export const astParseNode = (node: any, text: string, name:string = ""):any => {
    // 进行函数判断和解析
    if (inNodeTypeArr.indexOf(node.type)>-1) {
        const tmp = {
            name: (node.id?node.id.name:'')||name,
            params: [] as any,
            returnText: ''
        }

        // params
        walkParams(node.params, text, (info: any) => {
            tmp.params.push(info)
        })
        // returns
        if (node.returnType) {
            tmp.returnText = walkReturnType(node.returnType, text)
        }
        return tmp
        // 变量
    } else if (node.type === 'VariableDeclaration') {
        // 默认找第一个变量,并进行解析
        if(node.declarations && node.declarations.length>0){
            const fItem = node.declarations[0]
            if (fItem.init) {
                return astParseNode(fItem.init, text)
            }
        }
        // 属性
    }else if(node.type === 'Property' && node.value){
        return astParseNode(node.value, text, node.key.name)
        
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
        // 属性定义（class下）
    }else if(node.type === 'PropertyDefinition' && node.value){
        return astParseNode(node.value, text, node.key.name)
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
        }else if(parm.range){
            let start = parm.range[0]
            let end = parm.range[1]

            // 存在json结构入参
            if(parm.type === 'ObjectPattern' ){
                // 无需{}
                start += 1
                end -= 1
            }
            parm.typeText = text.substring(start, end)
        }
       
        if (call) {
            call({
                typeText: parm.typeText || '*',
                name: parm.name || `parm${(j+1)}`
            })
        }
    }
}

// 生成return类容
const walkReturnType = (returnType:any,  text: string)=>{
    const range = returnType.range
    return text.substring(range[0] + 1, range[1])
}
           
