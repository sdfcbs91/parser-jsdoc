export const walk = (ast:any, option:any)=>{
    return visit(ast,null,ast.type,0,option)
}
/**
 *
 * @param {any} node
 * @param {any} parent
 * @param {string} [prop]
 * @param {number} [index]
 * @param {any} [option]
 * @returns {any}
 */
let breakBool = false
const visit = (node:any, parent:any, prop:string, index:number, option:any)=>{
    if(node){
        const enter = option.enter
        if(enter){
            breakBool = enter({   
                node,
                parent:parent||null,
                prop, 
                index:index||0
            }) === false;

            if(breakBool === false){
                let child= node.body || node.declarations || node.declaration || node.callee || node.object || node.init || node.properties

                if(child){
                    if(child.constructor === Array){
                        for(let i =0; i<child.length;i++){
                            visit(child[i],node,child[i].type,i,option)
                        }
                    }else if(child.constructor === Object){
                        visit(child,node,child.type,0,option)
                    }
                }
              
                
            }
        }
    }
    breakBool = false
    return node
}