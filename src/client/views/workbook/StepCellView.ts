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
import { http } from "../../http/ClientHTTP";
import { curUser, HTTPLog, HTTPLogResponse, HTTPResult } from "../../../common/http/httpTypes";
import { StepRunJSON } from "../../../common/WorkbookJSON";



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
                //DB.msg(`output ${output} clicked`)
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
                    let instanceId = this.unitInst.instanceId;
                    let unitId = this.unitInst.typeId();
                    let wbId = wb.workbook;
                    let projId = wb.project;
                    let actId = wb.activity;
                    let paramValue = this.unitInst.paramValue;
                    let email = http.curUser!.email
                    let instanceInfo:StepRunJSON = {
                        instanceId:instanceId,
                        unitId:unitId,
                        wbId:wbId,
                        projId:projId,
                        actId:actId,
                        userEmail:email,
                        paramValue:paramValue,
                        inputSources:this.inputInstSources()
                    }
                    http.run(instanceInfo,(logResponse:HTTPLog)=>{
                        DB.msg(`log for ${this.stepInstanceName()}`,logResponse)
                    }).then((rslt:HTTPResult)=>{
                        if (rslt.success){
                            this.unitInst.stepComputeTime=Date.now();
                        } else {
                            this.unitInst.stepComputeTime=0;
                        }
                        this.buildView();
                        ZUI.notify();
                        this.unitInst.workbook.dirty();
                    })
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
        inputInstSources():{id:string,sourceInstId:string,outputId:string}[]{
            let rslt:{id:string,sourceInstId:string,outputId:string}[]=[];
            let flow = this.unitInst.flowSheet;
            for (let inputS of this.unitInst.inputSources){
                let dataRef = inputS.dataRef
                if (dataRef){
                    let {refRow,refCol}=flow.resolveRef(dataRef,this.unitInst);
                    let srcInst = flow.rcInstance(refRow,refCol);
                    if (srcInst){
                        rslt.push({id:inputS.id,sourceInstId:srcInst.instanceId,outputId:dataRef.outputId})
                    }
                }
            }
            return rslt;
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