import { DB } from "../../../../../Zing3/share/DB";
import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { LoadContext } from "../LoadContext";



export class InstanceView extends ZUI{
    private context:LoadContext
    constructor(context:LoadContext){
        super();
        this.context=context;
        let ins = new DivUI([
            new TextUI("instance").style("col-12")
        ]).style("col-12")
        this.content=ins;
    }
    load(){
        DB.msg("load not done")
    }

}