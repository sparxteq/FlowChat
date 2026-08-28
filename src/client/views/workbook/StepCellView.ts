import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { ButtonUI } from "../../../../../Zing3/zui/ButtonUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { StepInstanceClient } from "../../workbook/StepInstanceClient";
import { UnitCellView } from "./UnitCellView";
import { NameString } from "../../../common/NameString";
import { DB } from "../../../../../Zing3/share/DB";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { Menu } from "../../menu/Menu";
import { ClickWrapperUI } from "../../../../../Zing3/zui/ClickWrapperUI";
import { WorkbookClient } from "../../workbook/WorkbookClient";



export class StepCellView extends UnitCellView{

    buildView(): ZUI {
        let inst = <StepInstanceClient>this.unitInst
        if (inst.displayOpen){
            return this.showOpen();
        } else {
            return this.showClosed()
        }
    }
    protected outputConnection(outputId:string):"none" | "good" | "bad"{
        let connection = this.unitInst.flowSheet.outputConnection(<StepInstanceClient>this.unitInst,outputId)
        return connection;
    }
    protected outputBar():ZUI{
        let inst = <StepInstanceClient>this.unitInst;
        let unit = inst.unitClient;
        let outputTypes = unit.outputTypes;
        let outputs:string[]=[];
        for (let ot of outputTypes){
            let name = NameString.toCapSpaced(ot.outputId);
            outputs.push(name)
        }
        let outputList:ZUI[]=[];
        for (let output of outputs){
            let outputBlock = this.outputBlock(output);
            outputList.push(outputBlock);
        }
        let bar = new DivUI(outputList);
        return bar;
    }
    protected outputBlock(output:string):ZUI{
        if (!this.unitInst.displayOpen){
            let div = new DivUI([]).style("OutputBlockClosed")
            div.id = WorkbookClient.outputDivId(this.unitInst.instanceId,output)
            return div;
        }
        let div = new DivUI([
            new TextUI(NameString.toCapSpaced(output)).style("OutputBlockText")
        ]).style("OutputBlock")
        div.id = WorkbookClient.outputDivId(this.unitInst.instanceId,output)
        let clicker = new ClickWrapperUI([div])
            .click((event:Event)=>{
                event.stopPropagation();
                DB.msg(`output ${output} clicked`)
                this.unitInst.workbook.selectOutput(this.unitInst.instanceId,output)
                this.sheetView.refreshView();
            })
        return clicker;
    }
    private showOpen():ZUI{
        let actionBarStyle="StepCellActionBar"
        let inst = this.unitInst;
        let wb = inst.workbook;
        if (wb.instanceIsSelected(inst.instanceId))
            actionBarStyle = "StepCellActionBarSelected"
        let doList:ZUI[]=[];
            doList.push(this.actionBar(()=>{
                    DB.msg(`do ${this.unitInst.typeId()}`)
                }).style(actionBarStyle))
            let pe = this.paramEdit()
            if (pe)
                doList.push(pe.style("StepCellParam"))
            doList.push(this.log().style("StepLog"))
        let div=new DivUI([
            new DivUI(doList).style("StepCellOpen"),
            this.inputBar().style("StepInputBar"),
            this.outputBar().style("StepOutputBar")
        ]).style("StepOpenContainer")
        let container = new ClickWrapperUI([div])
            .click((event:any)=>{
                event.stopPropagation()

                let wb = this.unitInst.workbook;
                wb.selectInstance(this.unitInst.instanceId,event.shiftKey)
                this.sheetView.refreshView();
            })
        container.id=this.unitInst.instanceId
        return container
    }
    
    private log():ZUI{
        return new DivUI([
            new TextUI("log")
        ])
    }
    private showClosed():ZUI{
        let actionBarStyle="StepCellActionBar"
        let inst = this.unitInst;
        let wb = inst.workbook;
        if (wb.instanceIsSelected(inst.instanceId))
            actionBarStyle = "StepCellActionBarSelected"
        let div=new DivUI([
            this.actionBar().style(actionBarStyle),
            this.inputBar().style("StepInputBar"),
            this.outputBar().style("StepOutputBar")
        ]).style("StepCellClosed")
        let container = new ClickWrapperUI([div])
            .click((event:any)=>{
                //DB.msg("step cell clicked")
                let wb = this.unitInst.workbook;
                wb.selectInstance(this.unitInst.instanceId,event.shiftKey)
                this.sheetView.refreshView();
            })
        container.id=this.unitInst.instanceId;
        return container
    }
}