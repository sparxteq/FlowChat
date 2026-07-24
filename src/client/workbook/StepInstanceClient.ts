import { DB } from "../../../../Zing3/share/DB";
import { StepId, StepInstanceId, ParamValueJSON, DataInstanceId, ViewInstanceId, StepInstanceJSON } from "../../common/workbookJSON";
import { StepClient } from "./StepClient";



export class StepInstanceClient {
    stepId:StepId='';
    private step:StepClient|undefined
    instanceId:string='';
    
    paramValue:ParamValueJSON={}
    inputDataInstanceIds:{[inputId:string]:DataInstanceId}={}
    outputDataInstanceIds:{[outputId:string]:DataInstanceId}={}
    outputViewInstanceIds:{[outputId:string]:ViewInstanceId[]}={}
    note=""
    private row=-1;
    private col=-1;
    getCell():{row:number,col:number} {
        return {row:this.row,col:this.col};
    }
    setCell(row:number,col:number){
        this.row=row;
        this.col=col;
    }
    fromJSON(json:StepInstanceJSON){
        this.stepId=json.stepId;
        this.instanceId=json.instanceId;
        this.row = json.row;
        this.col = json.col;
        this.paramValue=json.paramValue;
        this.inputDataInstanceIds=json.inputDataInstanceIds;
        this.outputDataInstanceIds=json.outputDataInstanceIds;
        this.outputViewInstanceIds=json.outputViewInstanceIds;
        this.note = json.note;
        this.resolveStep()
    }
    private resolveStep(){
        let step = StepClient.getStep(this.stepId);
        if (!step){
            DB.msg(`stepId ${this.stepId} does not exist`)
            return;
        }
        this.step=step;
    }
    toJSON():StepInstanceJSON{
        let rslt:StepInstanceJSON = {
            stepId:this.stepId,
            instanceId:this.instanceId,
            paramValue:this.paramValue,
            row:this.row,
            col:this.col,
            inputDataInstanceIds:this.inputDataInstanceIds,
            outputDataInstanceIds:this.outputDataInstanceIds,
            outputViewInstanceIds:this.outputViewInstanceIds,
            note:this.note
        }
        return rslt;
    }
}