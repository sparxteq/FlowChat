import { DB } from "../../../../Zing3/share/DB";
import { HTTPResult } from "../../common/http/httpTypes";
import { DataSourceRef, DataInstanceJSON, UnitId, UnitInstanceId, StepInstanceJSON, WorkbookJSON, UnitTypeId, UnitInstanceJSON } from "../../common/WorkbookJSON";
import { WorkClient } from "../WorkClient";
import { DataInstanceClient } from "./DataInstanceClient";
import { FlowSheetClient } from "./FlowSheetClient";
import { UnitClient } from "./UnitClient";
import { UnitInstanceClient } from "./UnitInstanceClient";



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
        
    
    async load():Promise<boolean>{
        let workbookRslt = await this.workClient.workbookGet(this.workbook
            ,this.project,this.activity,this.userEmail
        )
        if (!workbookRslt)
            return false;
        if (!workbookRslt.success){
            DB.msg(`workbookGet`,workbookRslt.msg)
            return false;
        }
        this.fromJSON(workbookRslt.data.wbJSON)
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
                if (this.sameFlowSheet(id,selectedId)){
                    this.selectedInstances=[id]
                    return;
                }
            }
            this.selectedInstances.push(id);
        }
        private redrawConnections(){
            DB.msg("redrawConnections not implemented")
        }
    private sameFlowSheet(instIdA:UnitInstanceId,instIdB:UnitInstanceId):boolean{
        let instA = this.getUnitInstance(instIdA);
        let fsA = instA.flowSheet;
        let instB = this.getUnitInstance(instIdB);
        let fsB = instB.flowSheet;
        return fsA==fsB;
    }
    private selectedInput?:{instanceId:UnitInstanceId,inputId:string};
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
        if (outputInstId)
            DB.msg(`connectInput ${outputInstId}.${outputId} > ${inputInstId}.${inputId}`)
        else
            DB.msg(`clear input ${inputInstId}.${inputId}`)
    }
}