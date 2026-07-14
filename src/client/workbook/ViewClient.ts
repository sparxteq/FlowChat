


export class ViewClient{
    id:string=""
    static async loadViews():Promise<void>{
        throw "not done"
    }
    private static registry:{[viewId:string]:ViewClient}={}
    private static register(view:ViewClient){
        let id = view.id;
        this.registry[id]=view;
    }
    static getView(viewId:string):ViewClient{
        return this.registry[viewId]
    }
}