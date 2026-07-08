import { DB } from "../../../Zing3/share/DB";
import { FlowChatContext } from "../common/FlowChatContext";


export class ServerHTTP{
    context:FlowChatContext;
    constructor(context:FlowChatContext){
        this.context=context
    }
    async httpPOST(params:{[paramNam:string]:string},req:any,res:any):Promise<{[field:string]:string}>{
        DB.msg(`httpPOST`,params)
        return {}
    }
}