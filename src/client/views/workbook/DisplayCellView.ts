import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { Menu } from "../../menu/Menu";
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
    private showOpen():ZUI{
        let doList:ZUI[]=[];
        doList.push(this.actionBar().style("DisplayCellActionBar"))
        let pe = this.paramEdit();
        if (pe)
            doList.push(pe.style("DisplayCellParam"))
        doList.push(this.display().style("DisplayDisplay"))
        let container=new DivUI([
            new DivUI(doList).style("DisplayCellOpen"),
            this.inputBar().style("DisplayInputBar"),
        ]).style("DisplayOpenContainer")
        return container
    }
    private showClosed():ZUI{
        let container=new DivUI([
            this.actionBar().style("DisplayCellActionBar"),
            this.inputBar().style("DisplayInputBar")
        ]).style("DisplayCellClosed")
        return container
    }
    private display():ZUI{
        return new DivUI([
            new TextUI("display")
        ])
    }
    
}