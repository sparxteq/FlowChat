import { z } from "zod";
import { UnitJSON, StepRunJSON, TypeName } from "../../common/WorkbookJSON";
import { TypeS } from "./TypeS";


export abstract class Unit {
    abstract unitTypeId():string;
    abstract description():string;
    abstract paramZod():z.ZodObject;
    abstract inputTypes():{inputId:string,typeName:TypeName}[]
    abstract outputTypes():{outputId:string,typeName:TypeName}[]

    abstract run(instanceInfo:StepRunJSON):Promise<boolean>;
    
    static uploadJSON():{[unitId:string]:UnitJSON}{
        let rslt:{[unitId:string]:UnitJSON}={}
        for (let unitId in this.registry){
            let unit = this.registry[unitId];
            let json = unit.toUnitJSON();
            rslt[unitId]=json;
        }
        return rslt;
    }
    private toUnitJSON():UnitJSON{
        let rslt:UnitJSON = {
            unitTypeId:this.unitTypeId(),
            description:this.description(),
            paramZod:this.paramZod(),
            inputTypes:this.inputTypes(),
            outputTypes:this.outputTypes()
        }
        return rslt;
    }
    private static registry:{[unitId:string]:Unit}={}
    protected static register(unit:Unit){
        let id = unit.unitTypeId();
        this.registry[id]=unit;
    }
    static getUnit(unitId:string):Unit{
        return this.registry[unitId]
    }
}