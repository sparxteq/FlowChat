import { DataInstanceJSON } from "../../common/workbookJSON"
import { ViewInstanceClient } from "./ViewInstanceClient"



export class DataInstanceClient {
    sourceStepInstanceId:string=""
    outputId:string="";
    viewInstances:ViewInstanceClient[]=[]
    timeGenerated:number=0
    note:string=""  

    fromJSON(json:DataInstanceJSON){
        this.sourceStepInstanceId=json.sourceStepInstanceId;
        this.outputId=json.outputId;
        this.timeGenerated=json.timeGenerated;
        this.viewInstances=[];
        for (let viJson of json.viewInstances){
            let vi = new ViewInstanceClient();
            vi.fromJSON(viJson)
            this.viewInstances.push(vi)
        }
        this.note=json.note;
    }
    toJSON():DataInstanceJSON{
        let instancesJSON:any[]=[];
        for (let vi of this.viewInstances){
            let viJson = vi.toJSON();
            instancesJSON.push(viJson)
        }
        let rslt:DataInstanceJSON = {
            sourceStepInstanceId:this.sourceStepInstanceId,
            outputId:this.outputId,
            viewInstances:instancesJSON,
            timeGenerated:this.timeGenerated,
            note:this.note
        }
        return rslt;
    }
}