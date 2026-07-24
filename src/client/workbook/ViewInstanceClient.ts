import { DB } from "../../../../Zing3/share/DB"
import { ParamValueJSON, ViewInstanceJSON } from "../../common/workbookJSON"
import { ViewClient } from "./ViewClient"



export class ViewInstanceClient{
    dataInstanceId:string=""
    viewType:string=""
    private view:ViewClient|undefined;
    instanceId:string="";
    viewParams:ParamValueJSON={}
    note:string=""
    
    fromJSON(json:ViewInstanceJSON){
        this.dataInstanceId=json.dataInstanceId;
        this.viewType=json.viewType;
        this.resolveView();
        this.instanceId=json.instanceId;
        this.viewParams=json.viewParams
        this.note=json.note;
        this.resolveView()
    }
    resolveView(){
        let view = ViewClient.getView(this.viewType)
        if (!view){
            DB.msg(`viewType ${this.viewType} does not exist`)
            return
        }
        this.view=view;
    }
    toJSON():ViewInstanceJSON{
        let rslt:ViewInstanceJSON={
            dataInstanceId:this.dataInstanceId,
            instanceId:this.instanceId,
            viewType:this.viewType,
            viewParams:this.viewParams,
            note:this.note
        }
        return rslt;
    }
}