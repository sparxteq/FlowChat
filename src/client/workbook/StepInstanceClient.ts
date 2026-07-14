import { DB } from "../../../../Zing3/share/DB";
import { StepId, StepInstanceId, ParamValueJSON, DataInstanceId, ViewInstanceId, StepInstanceJSON } from "../../common/workbookJSON";
import { StepClient } from "./StepClient";



export class StepInstanceClient {
    stepId:StepId='';
    private step:StepClient|undefined
    instanceId:string='';
    parentInstanceIds:StepInstanceId[]=[]
    childInstanceIds:StepInstanceId[]=[]
    paramValue:ParamValueJSON={}
    inputDataInstanceIds:{[inputId:string]:DataInstanceId}={}
    outputDataInstanceIds:{[outputId:string]:DataInstanceId}={}
    outputViewInstanceIds:{[outputId:string]:ViewInstanceId[]}={}
    note=""

    fromJSON(json:StepInstanceJSON){
        this.stepId=json.stepId;
        this.instanceId=json.instanceId;
        this.parentInstanceIds=json.parentInstanceIds;
        this.childInstanceIds=json.childInstanceIds;
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
            parentInstanceIds:this.parentInstanceIds,
            childInstanceIds:this.childInstanceIds,
            paramValue:this.paramValue,
            inputDataInstanceIds:this.inputDataInstanceIds,
            outputDataInstanceIds:this.outputDataInstanceIds,
            outputViewInstanceIds:this.outputViewInstanceIds,
            note:this.note
        }
        return rslt;
    }
}