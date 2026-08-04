import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { DisplayInstanceClient } from "../../workbook/DisplayInstanceClient";
import { UnitCellView } from "./UnitCellView";



export class DisplayCellView extends UnitCellView{
    buildView(): ZUI {
        let inst = <DisplayInstanceClient>this.unitInst
        if (inst.displayOpen){
            return this.showOpen()
        } else {
            return this.showClosed()
        }
    }
    menu():ZUI {
        throw new Error("Method not implemented.");
    }
    private showOpen():ZUI{
        let container=new DivUI([
            new DivUI([
                this.actionBar().style("DisplayCellActionBar"),
                this.paramEdit().style("DisplayCellParam"),
                this.display().style("DisplayDisplay")
            ]).style("DisplayCellOpen"),
            this.inputBar().style("DisplayInputBar"),
        ]).style("DisplayOpenContainer")
        return container
    }
    private showClosed():ZUI{
        let container=new DivUI([
            this.actionBar().style("DisplayCellActionBar")
        ]).style("DisplayCellClosed")
        return container
    }
    private display():ZUI{
        return new DivUI([
            new TextUI("display")
        ])
    }
    
}