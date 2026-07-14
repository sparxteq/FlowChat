import { z } from "zod";
import { StepJSON, TypeName } from "../../common/workbookJSON";
import { ClientHTTP } from "../http/ClientHTTP";
import { WorkClient } from "../WorkClient";



export class StepClient{
    stepId:string="";
    description:string="";
    paramZod:any
    inputTypes:{[inputId:string]:{
        type:TypeName,
        description:string
    }}={}
    outputTypes:{[outputId:string]:{
        type:TypeName,
        description:string
    }}={}
    static async loadSteps():Promise<void>{
        let wc = new WorkClient();
        let steps = (await wc.steps()).data;
        this.registry={};
        for(let stepId in steps){
            let stepJSON=<StepJSON>(steps[stepId])
            let sc = new StepClient();
            sc.fromJSON(stepJSON)
            this.register(sc);
        }
    }
    private fromJSON(json:StepJSON){
        this.stepId=json.stepId;
        this.description=json.description;
        let zd = z.fromJSONSchema(json.paramZod);
        this.paramZod=zd;
        this.inputTypes=json.inputTypes;
        this.outputTypes=json.outputTypes;
    }
    private static registry:{[step:string]:StepClient}={}
    private static register(step:StepClient){
        let id = step.stepId;
        this.registry[id]=step;
    }
    static getStep(stepId:string):StepClient{
        return this.registry[stepId]
    }
}