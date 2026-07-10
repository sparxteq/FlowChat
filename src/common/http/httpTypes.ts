

export type UserInfo = {
    email:string,
    firstName:string,
    lastName:string,
    error?:string
}
export var curUser:UserInfo;
export function setCurUser(cu:UserInfo){
    curUser=cu;
}

export type HTTPResult = {
    success:boolean,
    msg?:string,
    data?:any
}
export type HTTPActList = HTTPResult &{
    data:{
        email:string,
        actList:string[]
    }
}
export type HTTPActResult = HTTPResult & {
    data:{
        email:string,
        actName:string
    }
}
export type HTTPProjList = HTTPResult & {
    data:{
        email:string,
        actName:string,
        projList:string[]
    }
}
export type HTTPProjResult = HTTPResult & {
    data:{
        email:string,
        actName:string,
        projName:string
    }
}
export type HTTPWbList = HTTPResult & {
    data:{
        email:string,
        actName:string,
        projName:string,
        wbList:string[]
    }
}
export type HTTPWbResult = HTTPResult & {
    data:{
        email:string,
        actName:string,
        projName:string,
        wbName:string
    }
}
export type HTTPWbGetResult = HTTPResult & {
    data:{
        email:string,
        actName:string,
        projName:string,
        wbName:string,
        wbJSON:any
    }
}
/*export type ZWorkbookJSON = {
    activityPath:string,
    projectId:string,
    workbookId:string,
    templateId?:string,
    flow?:ZWorkbookFlowJSON,
    varTimes:{[varName:string]:number} // last time when this variable was closed by a step
    params?:{[stepPath:string]:{time:number,data:{[field:string]:any}}}  // current values for each step's parameters indexed by the step's Name path
}

export type ZWorkbookFlowJSON = ZFlowJSON & {
    templateId:string,
}

export type ZFlowJSON = ZStepJSON & {
    steps:ZStepJSON[]
}

export type ZStepJSON = {
    stepName:string,
    title:string,
    desc:string,
    typeName:string,
    paramType?:any,
    inputs:{[inputName:string]:(ZFieldJSON[])},
    inputSources:{[inputName:string]:{sourceStepName:string,outputName:string}},
    outputs:{[outputName:string]:(ZFieldJSON[])},
    outputViews:ZStepViewDesc[]
}
export type ZFieldJSON = any;

export type HTTPResult = {
    msg:string,
    data?:any
}
export type ZFilesDirectory = ZFilesDirectoryItem[]
export type ZFilesDirectoryItem = {
    name:string,
    isFolder:boolean,
    folderContents:ZFilesDirectory
}

export type ZStepViewDesc = {
    stepName?:string,          // name of the sibling step that generated the data
    outputName:string,        // name of the output variable that contains the data
    viewType:string,        // type name of the view implementation to be used
    viewTitle:string,        // name for this view in the user interface
    viewName:string           // internal name for this view
    viewSetupDesc:{[fieldName:string]:any}    
                            // each view will add additional information to 
                            // control the view setup
    viewParams:{[fieldName:string]:any}
                            // this is used to save interactive information
                            // such as selection ranges, color etc.
                            // this is information interactively set by the user
                            // through the view. That information gets stored here
                            // so that it will carry on to subsequent sessions
}
export type ZStepViews = ZStepViewDesc[];
export type ZStepViewSubDesc = {
    viewType:string,
    viewSetupDesc:{[fieldName:string]:any}
    viewParams:{[fieldName:string]:any}
}*/