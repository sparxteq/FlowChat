

export type WorkbookJSON = {
    rootStepId:string;
    stepInstances:{[stepInstanceId:string]:StepInstanceJSON}
    dataInstances:{[dataInstanceId:string]:DataInstanceJSON}
    viewInstances:{[viewInstanceId:string]:ViewInstanceJSON}
}
export type StepId= string // id for a Step from the StepRegistry
export type StepInstanceId = string;    // id for a stepinstance from the workbook's stepInstances
export type DataInstanceId = string;    // id for a data instance from the workbook's dataInstances
export type ViewInstanceId = string;    // id for a view instance from the workbook's viewInstances

export type StepInstanceJSON = {
    stepId:StepId,
    instanceId:string,
    parentInstanceIds:StepInstanceId[],
    childInstanceIds:StepInstanceId[],
    paramValue:ParamValueJSON,
    inputDataInstanceIds:{[inputId:string]:DataInstanceId},
    outputDataInstanceIds:{[outputId:string]:DataInstanceId},
    outputViewInstanceIds:{[outputId:string]:ViewInstanceId[]},
    note:string
}
export type StepRunJSON = {
    stepId:StepId,
    userEmail:string,
    actId:string,
    projId:string,
    wbId:string,
    instanceId:string,
    paramValue:ParamValueJSON
    inputInstanceIds:{[inputId:string]:DataInstanceJSON},
    outputInstanceIds:{[outputId:string]:DataInstanceJSON}
}

export type StepJSON = {
    stepId:StepId,
    description:string,
    paramZod:ZODType,
    inputTypes:{[inputId:string]:{
        type:TypeName,
        description:string
    }},
    outputTypes:{[outputId:string]:{
        type:TypeName,
        description:string
    }}
}
export type TypeName=string;
export type ZODType=any;

export type ParamValueJSON = {[paramId:string]:ParamTypeJSON}

export type ParamTypeJSON = number | string | boolean | ParamTypeJSON[] | ParamValueJSON

export type DataInstanceJSON = {
    sourceStepInstanceId:string,
    outputId:string,
    timeGenerated:number,
    note:string
}

export type ViewInstanceJSON = {
    dataInstanceId:string,
    viewId:string,
    viewParams:ParamValueJSON,
    note:string
}