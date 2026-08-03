import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { SheetCellView } from "./SheetCellView";



export class EmptyCellView extends SheetCellView{
    constructor(row:number,col:number){
        super();
        this.content = new DivUI([
            new TextUI(`[${row},${col}]`).style("EmptyCellText")
        ]).style("EmptyCellView")
    }
}