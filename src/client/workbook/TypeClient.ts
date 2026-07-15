import { TypeJSON } from "../../common/workbookJSON";
import { WorkClient } from "../WorkClient";


export class TypeClient{
    superTypes:TypeClient[]=[];
    typeName:string="";
    description:string="";
    static async loadTypes():Promise<void>{
        let wc = new WorkClient();
        let types = <TypeJSON[]>((await wc.types()).data);
        this.registry={}
        for (let typeJSON of types){
            let tc = new TypeClient();
            tc.fromJSON(typeJSON)
            this.register(tc);
        }
    }
    private fromJSON(json:TypeJSON){
        this.typeName=json.typeName;
        this.superTypes=[];
        for (let st of json.superTypes){
            let tc = TypeClient.getType(st);
            this.superTypes.push(tc);
        }
        this.description=json.description;
    }
    
    private static registry:{[step:string]:TypeClient}={}
    private static register(typeC:TypeClient){
        let id = typeC.typeName;
        this.registry[id]=typeC;
    }
    static getType(typeName:string):TypeClient{
        return this.registry[typeName]
    }
}