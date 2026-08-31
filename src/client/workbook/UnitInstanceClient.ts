import { DB } from "../../../../Zing3/share/DB";
import { DataSourceRef, ParamValueJSON, UnitInstanceJSON } from "../../common/WorkbookJSON";
import { FlowSheetClient } from "./FlowSheetClient";
import { WorkbookClient } from "./WorkbookClient";
import { StepInstanceClient } from "./StepInstanceClient";
import { UnitCellView } from "../views/workbook/UnitCellView";
import { TypeS } from "../../server/units/types/TypeS";
import { ZT } from "../../common/ZT";
import { NameString } from "../../common/NameString";
import { SheetView } from "../views/workbook/SheetView";



export abstract class UnitInstanceClient {
    typeId():string{
        let tid = this.constructor.name
        if (tid.startsWith("_"))
            tid=tid.slice(1)
        return tid;
    };
    abstract unitType():string;
    workbook:WorkbookClient;
    flowSheet:FlowSheetClient;
    execStatus:ExecuteStatus;
    stepComputeTime=0;
    constructor(flowSheet?:FlowSheetClient){
        this.execStatus = "unknown"
        if (flowSheet){
            this.flowSheet=<FlowSheetClient>flowSheet;
            this.workbook=(<FlowSheetClient>flowSheet).workbook;
        } else {
            this.flowSheet = <any>undefined;
            this.workbook = <any>undefined;
        }
    }
    abstract paramType():ZT;
    checkType(nameToCheck:string):string{
        let t = TypeS.getType(nameToCheck);
        if (!t){
            DB.msg(`type ${nameToCheck} does not exist`)
        }
        return nameToCheck
    }
    findInputDataRef(inputId:string):DataSourceRef|undefined{
        let inputs = this.inputSources;
        for (let input of inputs){
            if (input.id==inputId){
                return input.dataRef;
            }
        }
    }
    abstract inputTypes():{[inputId:string]:string}
    inputTypeCheck(inputId:string,sourceInst:StepInstanceClient):boolean{
        let dataRef = this.findInputDataRef(inputId);
        if (dataRef){
            let outputId = dataRef.outputId;
            let outputType = sourceInst.outputType(outputId)
            if (outputType){
                let inputType = this.inputTypes()[inputId];
                return TypeS.typeMatch(inputType,outputType)
            } else {
                return false;
            }
        }
        return false;
    }
    displayOpen=false;

    instanceId="";
    paramValue:ParamValueJSON={}
    paramChangeTime=0;
    protected row=-1;
    protected col=-1;
    note="";
    inputSources:{id:string,dataRef?:DataSourceRef}[]=[]

    abstract cellView(sheetView:SheetView):UnitCellView;
    getCell():{row:number,col:number} {
        return {row:this.row,col:this.col};
    }
    setCell(row:number,col:number){
        this.row=row;
        this.col=col;
    }
    moveInputRows(rowBase:number,rowInc:number){
        for (let inRef of this.inputSources){
            let dataRef = inRef.dataRef;
            if (dataRef){
                let {row,col}=this.getCell();
                let {row:sourceRow,col:sourceCol}=this.resolveRefRC(dataRef)
                if (dataRef.rowAbsolute){
                    if (sourceRow>=rowBase)
                        dataRef.row+=rowInc
                } else {
                    if (row<rowBase && sourceRow>=rowBase)
                        dataRef.row+=rowInc
                    else if (row>=rowBase && sourceRow<rowBase)
                        dataRef.row-=rowInc;
                }
            }
        }
    }
    moveInputCols(colBase:number,colInc:number){
        for (let inRef of this.inputSources){
            let dataRef = inRef.dataRef;
            if (dataRef){
                let {row,col}=this.getCell();
                let {row:sourceRow,col:sourceCol}=this.resolveRefRC(dataRef)
                if (dataRef.colAbsolute){
                    if (sourceCol>=colBase)
                        dataRef.col+=colInc
                } else {
                    if (col<colBase && sourceCol>=colBase)
                        dataRef.col+=colInc
                    else if (col>=colBase && sourceCol<colBase)
                        dataRef.col-=colInc;
                }
            }
        }
    }
    inputSource(inputId:string):{instance:UnitInstanceClient,outputId:string}{
        let sheet = this.flowSheet;
        for (let inRef of this.inputSources){
            if (inRef.id==inputId){
                let dataRef = inRef.dataRef;
                if (dataRef){
                    let {row,col} = this.resolveRefRC(dataRef);
                    let inst = sheet.rcInstance(row,col)
                    if (inst){
                        return {
                            instance:inst,
                            outputId:dataRef.outputId
                        }
                    }
                }
            }
        }
        return {
            instance:<any>undefined,
            outputId:""
        }
    }
    setInputSource(inputId:string,outInstId:string,outputId:string){
        
        let {row:inRow,col:inCol} = this.getCell();
        let outInst = this.workbook.getUnitInstance(outInstId);
        if (outInst){
            let {row:outRow,col:outCol}=outInst.getCell();
            for (let i=0;i<this.inputSources.length;i++){
                let inRef = this.inputSources[i];
                if (inRef.id==inputId){
                    inRef.dataRef = {
                            outputId:outputId,
                            rowAbsolute:false,
                            row:outRow-inRow,
                            colAbsolute:false,
                            col:outCol-inCol
                        }
                    return;
                }
            }
            
            this.inputSources.push({
                id:inputId,
                dataRef:{
                    outputId:outputId,
                    rowAbsolute:false,
                    row:outRow-inRow,
                    colAbsolute:false,
                    col:outCol-inCol
                }
            })
        }
        this.workbook.dirty();
    } 
    remInputSource(inputId:string){
        for (let i=0;i<this.inputSources.length;i++){
            let inRef = this.inputSources[i];
            if (inRef.id==inputId){
                inRef.dataRef=undefined;
                return;
            }
        }
        this.workbook.dirty()
    }
    private resolveRefRC(dataRef:DataSourceRef):{row:number,col:number}{
        let row=dataRef.row;
        let col=dataRef.col;
        if (!dataRef.rowAbsolute){
            row = this.row+row;
        }
        if (!dataRef.colAbsolute){
            col = this.col+col
        }
        return {row,col}
    }
    getDisplayOpen():boolean{
        return this.displayOpen;
    }
    setDisplayOpen(displayOpen:boolean){
        this.displayOpen = displayOpen;
        this.workbook.dirty();
    }
    fromJSON(json:UnitInstanceJSON){
        this.displayOpen=json.displayOpen;
        this.resolveType();
        this.instanceId=json.instanceId;
        this.row = json.row;
        this.col = json.col;
        this.paramValue=json.paramValue;
        this.inputSources=json.inputSources;
        this.note = json.note;
        this.stepComputeTime = json.stepComputeTime;
        this.paramChangeTime = json.paramChangeTime;
    }

    protected abstract resolveType():void;

    toJSON():UnitInstanceJSON{
        let rslt:UnitInstanceJSON = {
            displayOpen:this.displayOpen,
            instanceId:this.instanceId,
            unitTypeId:this.typeId(),
            paramValue:this.paramValue,
            row:this.row,
            col:this.col,
            inputSources:this.inputSources,
            note:this.note,
            stepComputeTime:this.stepComputeTime,
            paramChangeTime:this.paramChangeTime
        }
        return rslt;
    }
    abstract make(flowSheet:FlowSheetClient):UnitInstanceClient;
    private static registry:{[typeId:string]:UnitInstanceClient}={}
    private static viewTable:{[typeId:string]:boolean}={}
    private static unitList(typeIdList:string[]):{name:string,typeId:string}[]{
        let rslt:{name:string,typeId:string}[]=[]
        for (let typeId of typeIdList){
            let name = NameString.toCapSpaced(typeId);
            rslt.push({name:name,typeId:typeId})
        }
        rslt.sort((a,b)=>{
            return a.name.localeCompare(b.name);
        })
        return rslt;
    }
    static viewList():{name:string,typeId:string}[]{
        let typeIdList = Object.keys(this.viewTable);
        return this.unitList(typeIdList);
    }
    private static stepTable:{[typeId:string]:boolean}={}
    static stepList():{name:string,typeId:string}[]{
        let typeIdList = Object.keys(this.stepTable);
        return this.unitList(typeIdList);
    }
    static register(proto:UnitInstanceClient){
        let typeId = proto.typeId();
        this.registry[typeId]=proto;
        switch (proto.unitType()){
            case "view":
                this.viewTable[typeId]=true;
                break;
            case "step":
                this.stepTable[typeId]=true;
                break;
            default:
                DB.msg("invalid proto.unitType()",proto.unitType())
        }
    }
    static getInstance(typeId:string,flowSheet:FlowSheetClient):UnitInstanceClient|undefined{
        let proto = this.registry[typeId]
        if (proto){
            let newInst = proto.make(flowSheet);
            return newInst;
        }
    }
}
export function registerUnits(){

}

export type ExecuteStatus = 
    "unknown"           // status is not yet computed
    | "checking"        // in process of checking the status (detects loops)
    | "unconnected"     // no path to compute all inputs
    | "ready"           // all inputs have been computed but this step's outputs are not
    | "computed"        // all output times are newer than input or parameter times
    | "canCompute"      // connected but not ready or computed. If this instance is 
                        // is selected, there is a sequence of precursor instances that
                        // can be computed to make this instance ready

export type InputExecStatus = 
    "unconnected"       // No source or source instance is unconnected
    | "present"         // There is a connected output with a computed value
    | "canCompute"     // There is a connected output to a connected source but no 
                        // computed value