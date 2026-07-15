import { z } from "zod";
import { StepJSON, TypeName } from "../../common/workbookJSON";
import { ClientHTTP } from "../http/ClientHTTP";
import { WorkClient } from "../WorkClient";
import { TypeClient } from "./TypeClient";



export class StepClient{
    stepId:string="";
    description:string="";
    paramZod:any
    inputTypes:{[inputId:string]:TypeClient}={}
    outputTypes:{[outputId:string]:TypeClient}={}
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
        this.inputTypes={}
        for (let id in json.inputTypes){
            let typeName = json.inputTypes[id];
            let typeC = TypeClient.getType(typeName)
            this.inputTypes[id]=typeC;
        }
        this.outputTypes={}
        for (let id in json.outputTypes){
            let typeName = json.outputTypes[id];
            let typeC = TypeClient.getType(typeName);
            this.outputTypes[id]=typeC;
        }
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