import { z } from "zod";
import { StepJSON, StepRunJSON, TypeName } from "../../common/workbookJSON";


export abstract class Step {
    abstract stepId():string;
    abstract description():string;
    abstract paramZod():z.ZodObject;
    abstract inputTypes():{[inputId:string]:{
            type:TypeName,
            description:string
        }}
    abstract outputTypes():{[outputId:string]:{
            type:TypeName,
            description:string
        }}

    abstract run(instanceInfo:StepRunJSON):Promise<boolean>;
    
    static uploadJSON():{[stepId:string]:StepJSON}{
        let rslt:{[stepId:string]:StepJSON}={}
        for (let stepId in this.registry){
            let step = this.registry[stepId];
            let json = step.toStepJSON();
            rslt[stepId]=json;
        }
        return rslt;
    }
    private toStepJSON():StepJSON{
        let rslt:StepJSON = {
            stepId:this.stepId(),
            description:this.description(),
            paramZod:this.paramZod(),
            inputTypes:this.inputTypes(),
            outputTypes:this.outputTypes()
        }
        return rslt;
    }
    private static registry:{[stepId:string]:Step}={}
    protected static register(step:Step){
        let id = step.stepId();
        this.registry[id]=step;
    }
    static getStep(stepId:string):Step{
        return this.registry[stepId]
    }
}