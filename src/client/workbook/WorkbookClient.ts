import { DB } from "../../../../Zing3/share/DB";
import { HTTPResult } from "../../common/http/httpTypes";
import { DataSourceRef, DataInstanceJSON, UnitId, UnitInstanceId, StepInstanceJSON, WorkbookJSON, UnitTypeId, UnitInstanceJSON } from "../../common/WorkbookJSON";
import { overlayCurve, overlayLine, overlayRect, overlayStroke } from "../DrawOverlay";
import { WorkClient } from "../WorkClient";
import { DataInstanceClient } from "./DataInstanceClient";
import { FlowSheetClient } from "./FlowSheetClient";
import { UnitClient } from "./UnitClient";
import { InputExecStatus, UnitInstanceClient } from "./UnitInstanceClient";



export class WorkbookClient {
    userEmail:string;
    activity:string;
    project:string;
    workbook:string;
    private workClient:WorkClient;
    private rootStepId="";
    private unitInstances:{[instanceId:string]:UnitInstanceClient}={}
    private unitInstanceCount=0;
    flowSheet?:FlowSheetClient

    constructor(userEmail:string, activity:string, project:string,workbook:string){
        this.userEmail=userEmail;
        this.activity=activity,
        this.project=project,
        this.workbook=workbook,
        this.workClient=new WorkClient()
    }
    newUnitInstanceId(unitTypeId:UnitTypeId):string{
        this.unitInstanceCount++;
        let id = "UI-"+this.unitInstanceCount;
        let inst = UnitInstanceClient.getInstance(unitTypeId,this.flowSheet!);
        if (inst){
            inst.instanceId=id;
            this.unitInstances[id]=inst;
            return id;
        }
        return "";
    }
    /*unitInstanceIds():string[]{
        return Object.keys(this.unitInstances)
    }*/
    getUnitInstance(id:string):UnitInstanceClient{
        return this.unitInstances[id];
    }
    delUnitInstance(instanceId:string){
        let inst = this.unitInstances[instanceId];
        if (inst){
            delete this.unitInstances[instanceId]
            this.dirty();
        }
    }
        
    updateExecStatus(){
        for (let instId in this.unitInstances){
            let inst = this.getUnitInstance(instId);
            inst.execStatus="unknown"
        }
        for (let instId in this.unitInstances){
            let inst = this.getUnitInstance(instId);
            this.updateInstExecStatus(inst);
        }
    }
        private updateInstExecStatus(inst:UnitInstanceClient){
            if (!inst.stepComputeTime)
                inst.stepComputeTime=0;
            if (inst.execStatus=="checking"){
                inst.execStatus = "unconnected"
                return;
            }
            if (inst.execStatus!="unknown")
                return;
            inst.execStatus = "checking";
            let cumInputStatus:InputExecStatus = "present";
            let latestSourceExecTime = inst.paramChangeTime;
            if (!latestSourceExecTime)
                latestSourceExecTime=0;
            for (let inputS of inst.inputSources){
                if (inputS.dataRef){
                    let inSource = inst.inputSource(inputS.id);
                    let outInst = inSource.instance;
                    let outExecTime = outInst.stepComputeTime;
                    if (outExecTime>latestSourceExecTime)
                        latestSourceExecTime=outExecTime;
                    this.updateInstExecStatus(outInst);
                    let outStatus = outInst.execStatus;
                    switch(outStatus){
                        case "unconnected":
                            cumInputStatus="unconnected"
                            break;
                        case "ready": 
                        case "canCompute":
                            if (cumInputStatus == "present")
                                cumInputStatus = "canCompute"
                            break;
                        case "computed": // no change
                            break;
                    }
                } else {
                    cumInputStatus = "unconnected"
                }
            }
            switch(cumInputStatus){
                case "unconnected":
                    inst.execStatus="unconnected"
                    break;
                case "present":
                    if (inst.inputSources.length==0 && !inst.stepComputeTime){
                        inst.execStatus="ready"
                        break;
                    }
                    if (latestSourceExecTime>inst.stepComputeTime)
                        inst.execStatus="ready";
                    else
                        inst.execStatus="computed"
                    break;
                case "canCompute":
                    inst.execStatus="canCompute"
                    break;
            }
        }
    
    async load():Promise<boolean>{
        let workbookRslt = await this.workClient.workbookGet(this.workbook
            ,this.project,this.activity,this.userEmail
        )
        if (!workbookRslt)
            return false;
        if (!workbookRslt.success){
            //DB.msg(`workbookGet`,workbookRslt.msg)
            return false;
        }
        this.fromJSON(workbookRslt.data.wbJSON)
        this.updateExecStatus();
        return true;
    }
    private fromJSON(json:WorkbookJSON){
        this.rootStepId=json.rootStepId;
        this.unitInstances = {};
        if (json.flowSheet){
            this.flowSheet = FlowSheetClient.fromJSON(json.flowSheet,this)
        }
        for (let id in json.unitInstances){
            let typeId = json.unitInstances[id].unitTypeId;
            let ui = UnitInstanceClient.getInstance(typeId,this.flowSheet!);
            if (ui){
                ui.fromJSON(json.unitInstances[id])
                this.unitInstances[id]=ui;
            }
        }
        this.unitInstanceCount=json.unitInstanceCount;
        
    }
    private saveState:"idle" | "waiting" | "saving"="idle"
    private saveAgainPending=false;

    dirty(){
        this.updateExecStatus();
        switch (this.saveState){
            case "idle":
                this.saveState="waiting"
                setTimeout(()=>{
                    this.saveState="saving";
                    this.save().then(()=>{
                        this.saveState="idle";
                        if (this.saveAgainPending){
                            this.saveAgainPending=false;
                            this.dirty();
                        } 
                    })
                },3000)
                break;
            case "waiting":
                break;
            case "saving":
                this.saveAgainPending=true;
                break;
        }
    }
    async save():Promise<HTTPResult>{
        let json = this.toJSON();
        let wc = new WorkClient();
        let rslt = await wc.workbookSave(json,this.workbook
            ,this.project,this.activity,this.userEmail
        );
        return rslt;
    }
    toJSON():WorkbookJSON{
        let json:WorkbookJSON={
            rootStepId:this.rootStepId,
            unitInstances:this.unitsToJSON(),
            unitInstanceCount:this.unitInstanceCount,
        }
        if (this.flowSheet){
            json.flowSheet = this.flowSheet.toJSON();
        }
        return json;
    }
    private unitsToJSON():{[id:string]:UnitInstanceJSON}{
        let rslt:{[id:string]:UnitInstanceJSON}={}
        for (let id in this.unitInstances){
            let unitInstance = this.unitInstances[id];
            let json = unitInstance.toJSON();
            rslt[id]=json;
        }
        return rslt;
    }


    private selectedInstances:UnitInstanceId[]=[]
    private selectedInput?:{instanceId:UnitInstanceId,inputId:string};
    redrawConnections(){
        //DB.msg("redrawConnections")
        overlayStroke(2,"rgba(255,0,0,1)")
        if (this.selectedInput)
            this.redrawInputConnection(this.selectedInput.instanceId,this.selectedInput.inputId)
        this.redrawSelectedInstances();
    }   
        private inRect(instanceId:string,inputId:string):DOMRect | undefined{
            let id =  WorkbookClient.inputDivId(instanceId,inputId)
            let el = document.getElementById(id);
            let rect = el?.getBoundingClientRect();
            return rect;
        }
        private outRect(instanceId:string,outputId:string):DOMRect | undefined{
            let id =  WorkbookClient.outputDivId(instanceId,outputId)
            let el = document.getElementById(id);
            let rect = el?.getBoundingClientRect();
            return rect;
        }
        private redrawInputConnection(instanceId:string,inputId:string){

            let unitInst = this.getUnitInstance(instanceId);
            let flow = unitInst.flowSheet;
            let source = flow.inputSource(unitInst,inputId)
            if (source && source.instance){
                let inputRect = this.inRect(instanceId,inputId)
                let outputRect = this.outRect(source.instance.instanceId,source.outputId)
                if (inputRect && outputRect){
                    let inputCenter = inputRect.left + inputRect.width/2;
                    let outputCenter = outputRect.left + outputRect.width/2;
                    let offset = Math.abs(inputRect.bottom-outputRect.top)/2;
                    overlayCurve(inputCenter,inputRect.top
                        ,inputCenter,inputRect.top-offset
                        ,outputCenter,outputRect.bottom+offset
                        ,outputCenter,outputRect.bottom)
                    /*overlayLine(inputCenter,inputRect.top
                        ,inputCenter,inputRect.top-offset)
                    overlayLine(outputCenter,outputRect.bottom+offset
                        ,outputCenter,outputRect.bottom)*/
                }
            }
        }
        private redrawSelectedInstances(){
            for (let instId of this.selectedInstances){
                let inst = this.getUnitInstance(instId);
                if (inst){
                    let inputSources = inst.inputSources;
                    for (let inputS of inputSources){
                        this.redrawInputConnection(instId,inputS.id)
                    }
                }
            }
            //DB.msg("redrawSelectedInstances")
        }
    static inputDivId(instanceId:string,inputId:string):string{
        let id = instanceId+"_i_"+inputId;
        return id.toLocaleLowerCase()
    }
    static outputDivId(instanceId:string,outputId:string):string{
        let id = instanceId+"_o_"+outputId;
        return id.toLocaleLowerCase();
    }
    instanceIsSelected(id:UnitInstanceId):boolean{
        return this.selectedInstances.indexOf(id)>=0;
    }
    selectInstance(id:UnitInstanceId,shiftKey:boolean){
        this.selectedInput=undefined;
        if (shiftKey)
            this.multiSelectInstance(id);
        else {
            this.selectedInstances=[id]
        }
        this.redrawConnections()
    }
        private multiSelectInstance(id:UnitInstanceId){
            for (let selectedId of this.selectedInstances){
                if (selectedId == id)
                    return;
                if (!this.sameFlowSheet(id,selectedId)){
                    this.selectedInstances=[id]
                    return;
                }
            }
            this.selectedInstances.push(id);
            let rect = new RCRect();
            for (let selectId of this.selectedInstances){
                let inst = this.getUnitInstance(selectId)
                rect.addInst(inst)
            }
            this.selectedInstances=[]
            for (let instId in this.unitInstances){
                let inst = this.unitInstances[instId]
                let {row,col}=inst.getCell();
                if (rect.isIn(row,col))
                    this.selectedInstances.push(instId)
            }
        }
    private sameFlowSheet(instIdA:UnitInstanceId,instIdB:UnitInstanceId):boolean{
        let instA = this.getUnitInstance(instIdA);
        let fsA = instA.flowSheet;
        let instB = this.getUnitInstance(instIdB);
        let fsB = instB.flowSheet;
        return fsA.instanceId==fsB.instanceId;
    }
    inputIsSelected(instanceId:UnitInstanceId,inputId:string):boolean{
        if (this.selectedInput){
            if (this.selectedInput.instanceId==instanceId){
                if (this.selectedInput.inputId==inputId)
                    return true;
            }
        }
        return false;
    }
    selectInput(instanceId:UnitInstanceId,inputId:string){
        this.selectedInstances=[]
        if (this.inputIsSelected(instanceId,inputId)){
            this.connectInput(instanceId,inputId)
         }else 
            this.selectedInput = {instanceId:instanceId,inputId:inputId}
        this.redrawConnections();
    }
    selectOutput(instanceId:UnitInstanceId,outputId:string){
        if (this.selectedInput){
            if ( this.sameFlowSheet(instanceId,this.selectedInput.instanceId)){
                this.connectInput(this.selectedInput.instanceId,this.selectedInput.inputId,
                    instanceId,outputId)
            } else {
                this.selectedInput=undefined;
                this.selectedInstances=[];
            }
            this.redrawConnections();
        }
    }
    private connectInput(inputInstId:UnitInstanceId,inputId:string,
            outputInstId?:UnitInstanceId,outputId?:string){
        /*DB.msg("connectInput",{
            in:inputInstId,iid:inputId,out:outputInstId,oid:outputId
        })*/
        let inputInst = this.getUnitInstance(inputInstId);
        if (outputInstId){
            //DB.msg(`connectInput ${outputInstId}.${outputId} > ${inputInstId}.${inputId}`)
            inputInst.setInputSource(inputId,outputInstId,outputId!)
        }else{
            inputInst.remInputSource(inputId);
        }
        this.dirty();
    }
}

class RCRect{
    firstCol=-1;
    lastCol=-1;
    firstRow=-1;
    lastRow=-1;
    addInst(inst:UnitInstanceClient){
        let {row,col}=inst.getCell();
        if (this.firstCol<0){
            this.firstCol=col;
            this.lastCol=col;
            this.firstRow=row;
            this.lastRow=row;
        } else {
            if (col<this.firstCol)
                this.firstCol=col
            if (col>this.lastCol)
                this.lastCol=col;
            if (row<this.firstRow)
                this.firstRow=row;
            if (row>this.lastRow)
                this.lastRow=row;
        }
    }
    isIn(row:number,col:number):boolean{
        if (col<this.firstCol)
            return false;
        if (col>this.lastCol)
            return false;
        if (row<this.firstRow)
            return false;
        if (row>this.lastRow)
            return false;
        return true;
    }
}