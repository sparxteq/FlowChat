import { DataInstanceId, ViewInstanceId } from "../../common/workbookJSON";



export abstract class ViewClient{
    abstract viewTypeId():string
    static async loadViews():Promise<void>{
        throw "not done"
    }
    private static registry:{[viewTypeId:string]:ViewClient}={}
    protected static register(view:ViewClient){
        let id = view.viewTypeId();
        this.registry[id]=view;
    }
    static getView(viewTypeId:string):ViewClient{
        return this.registry[viewTypeId]
    }
}