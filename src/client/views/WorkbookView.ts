import { DivUI } from "../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";



export class WorkbookView extends ZUI{
    constructor(){
        super();
        let wb = new DivUI([
            new TextUI("workbook").style("col-12")
        ]).style("col-12")
        this.content=wb;
    }

}