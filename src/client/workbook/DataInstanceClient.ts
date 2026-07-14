import { DataInstanceJSON } from "../../common/workbookJSON"



export class DataInstanceClient {
    sourceStepInstanceId:string=""
    outputId:string=""
    timeGenerated:number=0
    note:string=""  

    fromJSON(json:DataInstanceJSON){
        this.sourceStepInstanceId=json.sourceStepInstanceId;
        this.outputId=json.outputId;
        this.timeGenerated=json.timeGenerated;
        this.note=json.note;
    }
    toJSON():DataInstanceJSON{
        let rslt:DataInstanceJSON = {
            sourceStepInstanceId:this.sourceStepInstanceId,
            outputId:this.outputId,
            timeGenerated:this.timeGenerated,
            note:this.note
        }
        return rslt;
    }
}