import { DivUI } from "../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";



export class ProjectView extends ZUI{
    constructor(){
        super();
        let proj = new DivUI([
            new TextUI("project").style("col-12")
        ]).style("col-12")
        this.content=proj;
    }

}

