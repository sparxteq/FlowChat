import { z } from "zod";
import { StepJSON, StepRunJSON, TypeName } from "../../common/workbookJSON";
import { TypeS } from "./TypeS";


export abstract class Step {
    abstract stepId():string;
    abstract description():string;
    abstract paramZod():z.ZodObject;
    abstract inputTypes():{[inputId:string]:TypeS}
    abstract outputTypes():{[outputId:string]:TypeS}

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
        let iTypes:{[inputId:string]:string}={};
        let inputTypes = this.inputTypes();
        for (let id in inputTypes){
            let it = inputTypes[id];
            let typeName = it.typeName;
            iTypes[id]=typeName;
        }
        let oTypes:{[outputId:string]:string}={};
        let outputTypes = this.outputTypes();
        for (let id in outputTypes){
            let ot = outputTypes[id];
            let typeName = ot.typeName;
            oTypes[id]=typeName;
        }
        let rslt:StepJSON = {
            stepId:this.stepId(),
            description:this.description(),
            paramZod:this.paramZod(),
            inputTypes:iTypes,
            outputTypes:oTypes
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