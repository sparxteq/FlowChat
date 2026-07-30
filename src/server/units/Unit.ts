
import { UnitJSON, StepRunJSON, TypeName } from "../../common/WorkbookJSON";
import { TypeS } from "./types/TypeS";
import { DB } from "../../../../Zing3/share/DB";
import { ZT } from "../../common/ZT";


export abstract class Unit {
    unitTypeId():string{
        return this.constructor.name;
    }
    abstract description():string;
    abstract paramType():ZT;
    abstract inputTypes():{inputId:string,typeName:TypeName}[]
    abstract outputTypes():{outputId:string,typeName:TypeName}[]

    abstract run(instanceInfo:StepRunJSON):Promise<boolean>;
    
    checkType(nameToCheck:string):string{
        let t = TypeS.getType(nameToCheck);
        if (!t){
            DB.msg(`type ${nameToCheck} does not exist`)
        }
        return nameToCheck
    }
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
            paramType:this.paramType().toJSON(),
            inputTypes:this.inputTypes(),
            outputTypes:this.outputTypes()
        }
        return rslt;
    }
    private static registry:{[unitId:string]:Unit}={}
    static register(unit:Unit){
        let id = unit.unitTypeId();
        this.registry[id]=unit;
    }
    static getUnit(unitId:string):Unit{
        return this.registry[unitId]
    }
}