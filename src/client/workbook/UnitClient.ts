import { z } from "zod";
import { UnitInstanceJSON, TypeName, UnitJSON } from "../../common/WorkbookJSON";
import { ClientHTTP } from "../http/ClientHTTP";
import { WorkClient } from "../WorkClient";
import { TypeClient } from "./TypeClient";



export class UnitClient{
    unitTypeId:string="";
    description:string="";
    paramZod:any
    inputTypes:{inputId:string,typeName:TypeName}[]=[]
    outputTypes:{outputId:string,typeName:TypeName}[]=[]
    static async loadSteps():Promise<void>{
        let wc = new WorkClient();
        let units = (await wc.units()).data;
        this.registry={};
        for(let unitId in units){
            let unitJSON=<UnitJSON>(units[unitId])
            let uc = new UnitClient();
            uc.fromJSON(unitJSON)
            this.register(uc);
        }
    }
    private fromJSON(json:UnitJSON){
        this.unitTypeId=json.unitTypeId;
        this.description=json.description;
        let zd = z.fromJSONSchema(json.paramZod);
        this.paramZod=zd;
        this.inputTypes=json.inputTypes;
        this.outputTypes= json.outputTypes;

    }
    private static registry:{[unit:string]:UnitClient}={}
    private static register(unit:UnitClient){
        let id = unit.unitTypeId;
        this.registry[id]=unit;
    }
    static getUnit(unitId:string):UnitClient{
        return this.registry[unitId]
    }
}