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
        for (let id in json.unitInstances){
            let typeId = json.unitInstances[id].unitTypeId;
            let ui = UnitInstanceClient.getInstance(typeId,this.flowSheet!);
            if (ui){
                ui.fromJSON(json.unitInstances[id])
                this.unitInstances[id]=ui;
            }
        }
        this.unitInstanceCount=json.unitInstanceCount;
        if (json.flowSheet){
            this.flowSheet = FlowSheetClient.fromJSON(json.flowSheet,this)
        }
    }
    dirty(){
        DB.msg("dirty not implemented")
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
}