import { BiClusterModel } from "./BiClusterModel";


export class BiClusterModelsSpec {
    private models:{[decision:string]:BiClusterModel}={}
    setModel(decision:string,model:BiClusterModel){
        this.models[decision]=model;
    }
    getModel(decision:string):BiClusterModel{
        return this.models[decision]
    }
    toJSON():any{
        let rslt:{[decision:string]:any}={}
        for (let decision in this.models){
            let json = this.models[decision].toJSON()
            rslt[decision]=json;
        }
        return rslt;
    }
    fromJSON(json:any){
        this.models={};
        for (let decision in json){
            let dJson = json[decision]
            let model = new BiClusterModel();
            model.fromJSON(dJson)
            this.models[decision]=model;
        }
    }
}