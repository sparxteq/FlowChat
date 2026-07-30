import { ZT, ZTJSON } from "./ZT";


export type WorkbookJSON = {
    rootStepId:string;
    unitInstances:{[unitInstanceId:string]:UnitInstanceJSON};
    unitInstanceCount:number;
    dataInstances:{[dataInstanceId:string]:DataInstanceJSON};
    flowSheet?:FlowSheetJSON;
    dataInstanceCount:number
}
export type FlowSheetJSON = {
    unitInstances:UnitInstanceId[]
}
export type UnitId= string // id for a Unit from the UnitRegistry
export type UnitInstanceId = string;    // id for a stepinstance from the workbook's stepInstances
export type DataInstanceId = string;    // id for a data instance from the workbook's dataInstances

export type UnitInstanceJSON = {
    unitTypeId:UnitTypeId,
    instanceId:string,
    row:number,
    col:number,
    paramValue:ParamValueJSON,
    inputs:{id:string,dataId?:DataInstanceId}[],
    outputs:{id:string,dataId?:DataInstanceId}[]
    note:string,
}
export type UnitTypeId=string;
export type StepInstanceJSON = UnitInstanceJSON & {
    outputs:{id:string,dataId?:DataInstanceId}[],
    flowSheet?:FlowSheetJSON,
}
export type StepRunJSON = {
    unitId:UnitId,
    userEmail:string,
    actId:string,
    projId:string,
    wbId:string,
    instanceId:string,
    paramValue:ParamValueJSON
    inputs:{id:string,dataId?:DataInstanceId}[],
    outputs:{id:string,dataId?:DataInstanceId}[]
}

export type UnitJSON = {
    unitTypeId:UnitTypeId,
    description:string,
    paramType:ZTJSON,
    inputTypes:{inputId:string,typeName:TypeName}[],
    outputTypes:{outputId:string,typeName:TypeName}[]
}
export type TypeJSON = {
    typeName:TypeName,
    superTypes:TypeName[],
    description:string
}
export type TypeName=string;

export type ParamValueJSON = {[paramId:string]:ParamTypeJSON}

export type ParamTypeJSON = number | string | boolean | ParamTypeJSON[] | ParamValueJSON

export type DataInstanceJSON = {
    sourceStepInstanceId:string,
    outputId:string,
    timeGenerated:number,
    note:string
}
