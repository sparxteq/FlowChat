import { DB } from "../../../../../Zing3/share/DB";
import { ClickWrapperUI } from "../../../../../Zing3/zui/ClickWrapperUI";
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
        let actionBarStyle = "DisplayCellActionBar";
        let inst = this.unitInst;
        let wb = inst.workbook;
        if (wb.instanceIsSelected(inst.instanceId))
            actionBarStyle = "DisplayCellActionBarSelected"
        doList.push(this.actionBar().style(actionBarStyle))
        let pe = this.paramEdit();
        if (pe)
            doList.push(pe.style("DisplayCellParam"))
        doList.push(this.display().style("DisplayDisplay"))
        let div =new DivUI([
            new DivUI(doList).style("DisplayCellOpen"),
            this.inputBar().style("DisplayInputBar"),
        ]).style("DisplayOpenContainer")
        let container = new ClickWrapperUI([div])
            .click((event:any)=>{
                let wb = this.unitInst.workbook;
                wb.selectInstance(this.unitInst.instanceId,event.shiftKey)
                this.sheetView.refreshView();
                //DB.msg("display cell clicked")
            })
        container.id=this.unitInst.instanceId;
        return container
    }
    private showClosed():ZUI{
        let actionBarStyle = "DisplayCellActionBar";
        let inst = this.unitInst;
        let wb = inst.workbook;
        if (wb.instanceIsSelected(inst.instanceId))
            actionBarStyle = "DisplayCellActionBarSelected"
        let div=new DivUI([
            this.actionBar().style(actionBarStyle),
            this.inputBar().style("DisplayInputBar")
        ]).style("DisplayCellClosed")
        let container = new ClickWrapperUI([div])
            .click((event:any)=>{
                let wb = this.unitInst.workbook;
                wb.selectInstance(this.unitInst.instanceId,event.shiftKey)
                this.sheetView.refreshView();
                //DB.msg("display cell clicked")
            })
        container.id=this.unitInst.instanceId;
        return container
    }
    private display():ZUI{
        return new DivUI([
            new TextUI("display")
        ])
    }
    
}