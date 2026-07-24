import { DB } from "../../../../Zing3/share/DB";
import { HTTPResult } from "../../common/http/httpTypes";
import { DataInstanceId, DataInstanceJSON, StepInstanceJSON, ViewInstanceJSON, WorkbookJSON } from "../../common/workbookJSON";
import { WorkClient } from "../WorkClient";
import { DataInstanceClient } from "./DataInstanceClient";
import { StepInstanceClient } from "./StepInstanceClient";
import { ViewInstanceClient } from "./ViewInstanceClient";



export class WorkbookClient {
    userEmail:string;
    activity:string;
    project:string;
    workbook:string;
    private workClient:WorkClient;
    private rootStepId="";
    private stepInstances:{[instanceId:string]:StepInstanceClient}={}
    private stepInstanceCount=0;
    private dataInstances:{[intanceId:string]:DataInstanceClient}={}
    private dataInstanceCount=0;
    private viewInstances:{[instanceId:string]:ViewInstanceClient}={}
    private viewInstanceCount=0;
    constructor(userEmail:string, activity:string, project:string,workbook:string){
        this.userEmail=userEmail;
        this.activity=activity,
        this.project=project,
        this.workbook=workbook,
        this.workClient=new WorkClient()
    }
    newStepInstanceId():string{
        this.stepInstanceCount++;
        return "SI-"+this.stepInstanceCount;
    }
    stepInstanceIds():string[]{
        return Object.keys(this.stepInstances)
    }
    getStepInstance(id:string):StepInstanceClient{
        return this.stepInstances[id];
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
    newViewInstanceId():string{
        this.viewInstanceCount++;
        return "VI-"+this.dataInstanceCount;
    }
    viewInstanceIds():string[]{
        return Object.keys(this.viewInstances)
    }
    getViewInstance(id:string):ViewInstanceClient{
        return this.viewInstances[id];
    }
    addStepInstance(row:number,col:number,inst:StepInstanceClient):string{
        let oldInst = this.rcInstance(row,col)
        if (oldInst){
            this.delStepInstance(oldInst.instanceId)
        }
        let newId = this.newStepInstanceId();
        inst.instanceId=newId;
        inst.setCell(row,col);
    }
    rcInstance(row:number,col:number):StepInstanceClient|undefined{
        for (let sId in this.stepInstances){
            let si = this.stepInstances[sId];
            let {row:iRow,col:iCol}=si.getCell();
            if (iRow==row && iCol==col)
                return si;
        }
        return undefined;
    }
    delStepInstance(instanceId:string){
        let inst = this.stepInstances[instanceId];
        if (inst){
            delete this.stepInstances[instanceId]
            this.deleteOutDataInstances(inst);
        }
    }
        private deleteOutDataInstances(inst:StepInstanceClient){
            for (let outputId in inst.outputDataInstanceIds){
                let outDataId = inst.outputDataInstanceIds[outputId];
                this.deleteDataInstance(outDataId);
            }
            inst.outputDataInstanceIds={};
        }
        private deleteDataInstance(dataId:DataInstanceId){
            for (let stepId in this.stepInstances){
                let inStepInst = this.stepInstances[stepId];
                for (let inStepInId in inStepInst.inputDataInstanceIds){
                    if (inStepInId == dataId){
                        delete inStepInst.inputDataInstanceIds[inStepInId]
                    }
                }
            }
            delete this.dataInstances[dataId]
        }
        
    nRows():number{
        let nr=0;
        for (let sId in this.stepInstances){
            let si = this.stepInstances[sId];
            let {row} = si.getCell()
            if (row>nr)
                nr=row;
        }
        return nr+1;
    }
    nCols():number{
        let nc=0;
        for (let sId in this.stepInstances){
            let si = this.stepInstances[sId];
            let {col} = si.getCell()
            if (col>nc)
                nc=col;
        }
        return nc+1;
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
        this.stepInstances = {};
        for (let id in json.stepInstances){
            let si = new StepInstanceClient();
            si.fromJSON(json.stepInstances[id])
            this.stepInstances[id]=si;
        }
        this.stepInstanceCount=json.stepInstanceCount;
        this.dataInstances = {};
        for (let id in json.dataInstances){
            let di = new DataInstanceClient();
            di.fromJSON(json.dataInstances[id])
            this.dataInstances[id]=di;
        }
        this.dataInstanceCount=json.dataInstanceCount;
        this.viewInstances = {};
        for (let id in json.viewInstances){
            let vi = new ViewInstanceClient();
            vi.fromJSON(json.viewInstances[id])
            this.viewInstances[id]=vi;
        }
        this.viewInstanceCount=json.viewInstanceCount;
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
            stepInstances:this.stepsToJSON(),
            stepInstanceCount:this.stepInstanceCount,
            dataInstances:this.dataToJSON(),
            dataInstanceCount:this.dataInstanceCount,
            viewInstances:this.viewsToJSON(),
            viewInstanceCount:this.viewInstanceCount,
        }
        return json;
    }
    private stepsToJSON():{[id:string]:StepInstanceJSON}{
        let rslt:{[id:string]:StepInstanceJSON}={}
        for (let id in this.stepInstances){
            let stepInstance = this.stepInstances[id];
            let json = stepInstance.toJSON();
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
    private viewsToJSON():{[id:string]:ViewInstanceJSON}{
        let rslt:{[id:string]:ViewInstanceJSON}={}
        for (let id in this.viewInstances){
            let viewInstance = this.viewInstances[id];
            let json = viewInstance.toJSON();
            rslt[id]=json;
        }
        return rslt;
    }
}