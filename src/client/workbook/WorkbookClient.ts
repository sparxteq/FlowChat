import { DB } from "../../../../Zing3/share/DB";
import { HTTPResult } from "../../common/http/httpTypes";
import { DataInstanceId, DataInstanceJSON, StepId, StepInstanceId, StepInstanceJSON, ViewInstanceId, ViewInstanceJSON, WorkbookJSON } from "../../common/workbookJSON";
import { WorkClient } from "../WorkClient";
import { DataInstanceClient } from "./DataInstanceClient";
import { StepInstanceClient } from "./StepInstanceClient";
import { ViewClient } from "./ViewClient";
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
        return "VI-"+this.viewInstanceCount;
    }
    addStepInstance(row:number,col:number,stepId:StepId):StepInstanceId{
        let inst=new StepInstanceClient()
        inst.stepId=stepId;
        inst.resolveStep()
        let oldInst = this.rcInstance(row,col)
        if (oldInst){
            this.delStepInstance(oldInst.instanceId)
        }
        let newId = this.newStepInstanceId();
        inst.instanceId=newId;
        inst.setCell(row,col);
        this.stepInstances[newId]=inst;
        this.dirty();
        return newId;
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
            this.dirty();
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
            this.dirty();
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
    addRow(rowAdd:number,nRowsToAdd=1){
        for (let stepInstId in this.stepInstances){
            let stepInst = this.stepInstances[stepInstId]
            let {row,col} = stepInst.getCell();
            if (row>=rowAdd){
                stepInst.setCell(row+nRowsToAdd,col)
            }
        }
        this.dirty();
    }
    delRow(rowDel:number,nRowsToDel:number){
        let rowBeyond = rowDel+nRowsToDel;
        for (let stepInstId in this.stepInstances){
            let stepInst = this.stepInstances[stepInstId]
            let {row,col} = stepInst.getCell();
            if (row>=rowDel){
                if (row<rowBeyond){
                    this.delStepInstance(stepInstId)
                } else {
                    stepInst.setCell(row-nRowsToDel,col)
                }
            }
        }
        this.dirty()
    }
    addCol(colAdd:number,nColsToAdd=1){
        for (let stepInstId in this.stepInstances){
            let stepInst = this.stepInstances[stepInstId]
            let {row,col} = stepInst.getCell();
            if (col>=colAdd){
                stepInst.setCell(row,col+nColsToAdd)
            }
        }
        this.dirty();
    }
    delCol(colDel:number,nColsToDel:number){
        let colBeyond = colDel+nColsToDel;
        for (let stepInstId in this.stepInstances){
            let stepInst = this.stepInstances[stepInstId]
            let {row,col} = stepInst.getCell();
            if (col>=colDel){
                if (col<colBeyond){
                    this.delStepInstance(stepInstId)
                } else {
                    stepInst.setCell(row,col-nColsToDel)
                }
            }
        }
        this.dirty()
    }
    addView(dataInstanceId:DataInstanceId,viewType:string):ViewInstanceId{
        let view = new ViewInstanceClient();
        view.instanceId = this.newViewInstanceId();
        view.viewType=viewType;
        view.resolveView()
        let data = this.dataInstances[dataInstanceId]
        if (data){
            if (!data.viewInstances)
                data.viewInstances=[];
            view.dataInstanceId=dataInstanceId;
        }
        this.dirty();
        return view.instanceId;
    }
    delView(dataInstanceId:DataInstanceId,viewInstanceId:ViewInstanceId){
        let dataInst = this.dataInstances[dataInstanceId];
        if (dataInst){
            let views = dataInst.viewInstances;
            if (views){
                for (let vIdx=0;vIdx<views.length;vIdx++){
                    let vi=views[vIdx]
                    if (vi.instanceId==viewInstanceId){
                        views.splice(vIdx,1);
                        dataInst.viewInstances=views;
                        this.dirty();
                    }
                }
            }
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

        this.viewInstanceCount=json.viewInstanceCount;
    }
    private dirty(){
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
            stepInstances:this.stepsToJSON(),
            stepInstanceCount:this.stepInstanceCount,
            dataInstances:this.dataToJSON(),
            dataInstanceCount:this.dataInstanceCount,
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
}