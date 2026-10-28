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
import { curUser, HTTPLog, HTTPLogEntry, HTTPLogResponse, HTTPResult } from "../../../common/http/httpTypes";
import { DataSourceRef, StepRunJSON } from "../../../common/WorkbookJSON";
import { LogView } from "./LogView";
import { Modal } from "../../../../../Zing3/zui/Modal";
import { SheetView } from "./SheetView";



export class StepCellView extends UnitCellView{
    private logView
    constructor(unitInst:UnitInstanceClient,sheetView:SheetView){
        super(unitInst,sheetView)
        this.logView = new LogView(this.unitInst.instanceId)
    }
    buildView(): ZUI {
        if (!this.logView)
            this.logView = new LogView(this.unitInst.instanceId)
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
            let name = ot.outputId;
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
        //if (wb.instanceIsSelected(inst.instanceId))
        //    actionBarStyle = "StepCellActionBarSelected"
        
        
        let doList:ZUI[]=[];
            doList.push(this.actionBar(()=>{
                    switch(this.unitInst.execStatus){
                        case "unknown":
                        case "checking":
                            Modal.alert(`code error "execStatus=${this.unitInst.execStatus}"`)
                            return;
                        case "unconnected":
                            Modal.alert(`step ${this.unitInst.name()} is missing input connections`)
                            return;
                        case "ready":
                        case "computed":{
                                this.doAction().then(()=>{
                                    this.sheetView.flowSheet!.workbook.updateExecStatus();
                                })
                                return;
                            }
                        case "canCompute":
                            this.doActionScript().then(()=>{
                                this.sheetView.flowSheet!.workbook.updateExecStatus();
                            })
                            return;
                    }
                }).style(actionBarStyle))
            let pe = this.paramEdit()
            if (pe)
                doList.push(pe.style("StepCellParam"))
            this.logView.setLog(this.log())
            doList.push(this.logView.style("StepLog"))
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
        //return container
        return div;
    }
        private async doActionScript():Promise<void>{
            let script:string[]=[]
            this.buildActionScript(script);
            await this.executeActionScript(script);
        }
        private buildActionScript(script:string[]){
            let inst = <StepInstanceClient>this.unitInst;
            switch(inst.execStatus){
                case "unknown":
                case "checking":
                case "unconnected":
                    return;
                case "ready":
                    if (script.indexOf(this.unitInst.instanceId)<0){
                        script.push(this.unitInst.instanceId);
                        inst.displayOpen=true;
                        inst.log={
                            success:true,
                            data:{
                                stack:[],
                                runStatus:"pending"
                            }
                        }
                    }
                    break;
                case "canCompute":
                    let sources = this.unitInst.inputSources;
                    for (let inputSource of sources){
                        let instId=inputSource.srcRef!.srcInstId
                        let inst = this.sheetView.flowSheet!.workbook.getUnitInstance(instId);
                        
                        let view = inst.cellView(this.sheetView);
                        if (view instanceof StepCellView)
                            view.buildActionScript(script);
                    }
                    if (script.indexOf(this.unitInst.instanceId)<0){
                        script.push(this.unitInst.instanceId)
                        inst.displayOpen=true;
                        inst.log={
                            success:true,
                            data:{
                                stack:[],
                                runStatus:"pending"
                            }
                        }
                    }
                    break;
            }
        }
        private async executeActionScript(script:string[]):Promise<void>{
            for (let instanceId of script){
                let inst = this.sheetView.flowSheet!.workbook.getUnitInstance(instanceId)
                let view = inst.cellView(this.sheetView);
                if (view instanceof StepCellView){
                    await view.doAction()
                }
            }
        }
        private async doAction():Promise<void>{
            let inst = this.unitInst;
            let wb = inst.workbook;
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
            this.unitInst.stepComputeTime=0;
            await wb.save()
            this.logView.running()
            let rslt:HTTPResult =await http.run(instanceInfo,(logResponse:HTTPLog)=>{
                    DB.msg(`log for ${this.instanceName()}`,logResponse)
                    
                    let stepInst = <StepInstanceClient>this.unitInst;
                    stepInst.log=logResponse;
                    this.logView.setLog(stepInst.log)
                    stepInst.workbook.dirty();
                })
            if (rslt.success){
                this.unitInst.stepComputeTime=Date.now();
            } else {
                this.unitInst.stepComputeTime=0;
            }
            let stepInst = <StepInstanceClient>this.unitInst;
            stepInst.log=<HTTPLog>rslt;
            this.logView.setLog(stepInst.log)
            this.unitInst.workbook.dirty();
            ZUI.notify()
            DB.msg(`done ${this.unitInst.typeId()}`)
        }
        inputInstSources():{id:string,sourceInstId:string,outputId:string}[]{
            let rslt:{id:string,sourceInstId:string,outputId:string}[]=[];
            let flow = this.unitInst.flowSheet;
            for (let inputS of this.unitInst.inputSources){
                let srcRef = inputS.srcRef
                if (srcRef){
                    let srcInst = this.sheetView.flowSheet!.workbook.getUnitInstance(srcRef.srcInstId);
                    if (srcInst){
                        rslt.push({id:inputS.id,sourceInstId:srcInst.instanceId,outputId:srcRef.outputId})
                    }
                }
            }
            return rslt;
        }
    
    private log():HTTPLog{
        let log = (<StepInstanceClient>this.unitInst).log;
        if (log)
            return log
        else
            return {
                success:true,
                data:{
                    stack:[],
                    runStatus:"pending"
                }
            }
    }
    
    private showClosed():ZUI{
        let actionBarStyle="StepCellActionBar"
        let inst = this.unitInst;
        let wb = inst.workbook;
        //if (wb.instanceIsSelected(inst.instanceId))
        //    actionBarStyle = "StepCellActionBarSelected"
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
        return div
    }
}