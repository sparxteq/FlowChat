import { DivUI } from "../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";



export class InstanceView extends ZUI{
    constructor(){
        super();
        let ins = new DivUI([
            new TextUI("instance").style("col-12")
        ]).style("col-12")
        this.content=ins;
    }

}