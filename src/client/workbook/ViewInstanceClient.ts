import { DB } from "../../../../Zing3/share/DB"
import { ParamValueJSON, ViewInstanceJSON } from "../../common/workbookJSON"
import { ViewClient } from "./ViewClient"



export class ViewInstanceClient{
    dataInstanceId:string=""
    viewId:string=""
    private view:ViewClient|undefined;
    viewParams:ParamValueJSON={}
    note:string=""

    fromJSON(json:ViewInstanceJSON){
        this.dataInstanceId=json.dataInstanceId;
        this.viewId=json.viewId;
        this.viewParams=json.viewParams
        this.note=json.note;
        this.resolveView()
    }
    private resolveView(){
        let view = ViewClient.getView(this.viewId)
        if (!view){
            DB.msg(`viewId ${this.viewId} does not exist`)
            return
        }
        this.view=view;
    }
    toJSON():ViewInstanceJSON{
        let rslt:ViewInstanceJSON={
            dataInstanceId:this.dataInstanceId,
            viewId:this.viewId,
            viewParams:this.viewParams,
            note:this.note
        }
        return rslt;
    }
}