import { DB } from "../../../../Zing3/share/DB";
import { HTTPResult } from "../../common/http/httpTypes";
import { DataInstanceId, DataInstanceJSON, UnitId, UnitInstanceId, StepInstanceJSON, WorkbookJSON, UnitTypeId, UnitInstanceJSON } from "../../common/WorkbookJSON";
import { WorkClient } from "../WorkClient";
import { DataInstanceClient } from "./DataInstanceClient";
import { FlowTableClient } from "./FlowTableClient";
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
    private dataInstances:{[intanceId:string]:DataInstanceClient}={}
    private dataInstanceCount=0;
    private flowTable?:FlowTableClient

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
        let inst = new UnitInstanceClient(this);
        inst.unitTypeId=unitTypeId;
        inst.instanceId=id;
        this.unitInstances[id]=inst;
        inst.resolveUnit();
        return id;
    }
    /*unitInstanceIds():string[]{
        return Object.keys(this.unitInstances)
    }*/
    getUnitInstance(id:string):UnitInstanceClient{
        return this.unitInstances[id];
    }
    newDataInstanceId():string{
        this.dataInstanceCount++;
        return "DI-"+this.dataInstanceCount;
    }
    dataInstanceIds():string[]{
        return Object.keys(this.dataInstances)
    }
    getDataInstance(id:string):DataInstanceClient{
        return this.dataInstances[id];
    }
    delUnitInstance(instanceId:string){
        let inst = this.unitInstances[instanceId];
        if (inst){
            delete this.unitInstances[instanceId]
            this.deleteOutDataInstances(inst);
            this.dirty();
        }
    }
        private deleteOutDataInstances(inst:UnitInstanceClient){
            for (let outputInst of inst.outputs){
                this.deleteDataInstance(outputInst.id);
            }
            inst.outputs=[];
        }
        private deleteDataInstance(dataId:DataInstanceId){
            for (let unitId in this.dataInstances){
                let inUnitInst = this.unitInstances[unitId];
                for (let inDat of inUnitInst.inputs){
                    if (inDat.dataId && inDat.dataId == dataId){
                        inDat.dataId=undefined;
                    }
                }
            }
            delete this.dataInstances[dataId]
            this.dirty();
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
        this.fromJSON(workbookRslt.data)
        return true;
    }
    private fromJSON(json:WorkbookJSON){
        this.rootStepId=json.rootStepId;
        this.unitInstances = {};
        for (let id in json.unitInstances){
            let ui = new UnitInstanceClient(this);
            ui.fromJSON(json.unitInstances[id])
            this.unitInstances[id]=ui;
        }
        this.unitInstanceCount=json.unitInstanceCount;
        this.dataInstances = {};
        for (let id in json.dataInstances){
            let di = new DataInstanceClient();
            di.fromJSON(json.dataInstances[id])
            this.dataInstances[id]=di;
        }
        this.dataInstanceCount=json.dataInstanceCount;
        if (json.flowTable){
            this.flowTable = FlowTableClient.fromJSON(json.flowTable,this)
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
            dataInstances:this.dataToJSON(),
            dataInstanceCount:this.dataInstanceCount,
        }
        if (this.flowTable){
            json.flowTable = this.flowTable.toJSON();
        }
        return json;
    }
    private unitsToJSON():{[id:string]:UnitInstanceJSON}{
        let rslt:{[id:string]:StepInstanceJSON}={}
        for (let id in this.unitInstances){
            let unitInstance = this.unitInstances[id];
            let json = unitInstance.toJSON();
            rslt[id]=json;
        }
        return rslt;
    }
    private dataToJSON():{[id:string]:DataInstanceJSON}{
        let rslt:{[id:string]:DataInstanceJSON}={}
        for (let id in this.dataInstances){
            let dataInstance = this.dataInstances[id];
            let json = dataInstance.toJSON();
            rslt[id]=json;
        }
        return rslt;
    }
}