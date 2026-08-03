import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { UnitCellView } from "./UnitCellView";



export class StepCellView extends UnitCellView{

    buildView(): ZUI {
        return new TextUI("Step "+this.str);
    }
    menu():ZUI {
        throw new Error("Method not implemented.");
    }
    
}