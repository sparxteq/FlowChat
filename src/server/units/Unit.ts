
import { UnitJSON, StepRunJSON, TypeName } from "../../common/WorkbookJSON";
import { TypeS } from "./types/TypeS";
import { DB } from "../../../../Zing3/share/DB";
import { ZT } from "../../common/ZT";
import { Log } from "../../client/log/Log";
import { WorkServer } from "../WorkServer";
import { FilesFS } from "../files/FilesFS"


export abstract class Unit {
    unitTypeId():string{
        return this.constructor.name;
    }
    abstract description():string;
    abstract paramType():ZT;
    abstract inputTypes():{inputId:string,typeName:TypeName}[]
    abstract outputTypes():{outputId:string,typeName:TypeName}[]

    abstract run(instanceInfo:StepRunJSON,log:Log):Promise<boolean>;
    
    checkType(nameToCheck:string):string{
        let t = TypeS.getType(nameToCheck);
        if (!t){
            DB.msg(`type ${nameToCheck} does not exist`)
        }
        return nameToCheck
    }
    
    outputFileName(outputId:string,instanceInfo:StepRunJSON):string{
        let oTypes = this.outputTypes();
        let found = false;
        for (let ot of oTypes){
            if (ot.outputId.toLowerCase()==outputId.toLowerCase())
                found=true;
        }
        if (!found)
            throw "**** no such outputId "+outputId+" on "+instanceInfo.unitId;
        let i = instanceInfo;
        let fn = WorkServer.outputVarFile(i.userEmail,i.actId,i.projId,i.wbId,i.instanceId
            ,outputId)
        return fn;
    }
    inputFileName(inputId:string,instanceInfo:StepRunJSON):string{
        let i = instanceInfo;
        let inSource:{id:string,sourceInstId:string,outputId:string}=<any>undefined;
        for (let inputS of instanceInfo.inputSources){
            if (inputS.id.toLowerCase()==inputId.toLowerCase())
                inSource=inputS;
        }
        if (!inSource)
            throw "**** no such inputId "+inputId+" on "+instanceInfo.unitId;

        let fn = WorkServer.outputVarFile(i.userEmail,i.actId,i.projId,i.wbId,inSource.sourceInstId,inSource.outputId)
        return fn;
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