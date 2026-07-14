import { DB } from "../../../../Zing3/share/DB";
import { HTTPResult } from "../../common/http/httpTypes";
import { DataInstanceJSON, StepInstanceJSON, ViewInstanceJSON, WorkbookJSON } from "../../common/workbookJSON";
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
    private dataInstances:{[intanceId:string]:DataInstanceClient}={}
    private viewInstances:{[instanceId:string]:ViewInstanceClient}={}
    constructor(userEmail:string, activity:string, project:string,workbook:string){
        this.userEmail=userEmail;
        this.activity=activity,
        this.project=project,
        this.workbook=workbook,
        this.workClient=new WorkClient()
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
        this.dataInstances = {};
        for (let id in json.dataInstances){
            let di = new DataInstanceClient();
            di.fromJSON(json.dataInstances[id])
            this.dataInstances[id]=di;
        }
        this.viewInstances = {};
        for (let id in json.viewInstances){
            let vi = new ViewInstanceClient();
            vi.fromJSON(json.viewInstances[id])
            this.viewInstances[id]=vi;
        }
        
    }
    async save():Promise<HTTPResult>{
        
    }
    toJSON():WorkbookJSON{
        let json:WorkbookJSON={
            rootStepId:this.rootStepId,
            stepInstances:this.stepsToJSON(),
            dataInstances:this.dataToJSON(),
            viewInstances:this.viewsToJSON()
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