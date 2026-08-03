import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { UnitCellView } from "./UnitCellView";



export class DisplayCellView extends UnitCellView{
    buildView(): ZUI {
        return new TextUI("Display "+this.str);
    }
    menu():ZUI {
        throw new Error("Method not implemented.");
    }
    
}