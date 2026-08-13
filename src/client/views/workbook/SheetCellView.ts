import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { SheetView } from "./SheetView";




export class SheetCellView extends ZUI{
    sheetView:SheetView;
    constructor(sheetView:SheetView){
        super();
        this.sheetView=sheetView;
    }
}