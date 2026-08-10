import { DB } from "../../../../Zing3/share/DB";
import { DataSourceRef, ParamValueJSON, UnitInstanceJSON } from "../../common/WorkbookJSON";
import { FlowSheetClient } from "./FlowSheetClient";
import { WorkbookClient } from "./WorkbookClient";
import { StepInstanceClient } from "./StepInstanceClient";
import { UnitCellView } from "../views/workbook/UnitCellView";
import { TypeS } from "../../server/units/types/TypeS";
import { ZT } from "../../common/ZT";



export abstract class UnitInstanceClient {
    typeId():string{
        let tid = this.constructor.name
        if (tid.startsWith("_"))
            tid=tid.slice(1)
        return tid;
    };
    workbook:WorkbookClient;
    flowSheet:FlowSheetClient;
    constructor(flowSheet?:FlowSheetClient){
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
    protected row=-1;
    protected col=-1;
    note="";
    inputSources:{id:string,dataRef?:DataSourceRef}[]=[]

    abstract cellView():UnitCellView;
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
    inputSource(sheet:FlowSheetClient,inputId:string):{instance:UnitInstanceClient,outputId:string}{
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
            note:this.note
        }
        return rslt;
    }
    abstract make(flowSheet:FlowSheetClient):UnitInstanceClient;
    private static registry:{[typeId:string]:UnitInstanceClient}={}
    static register(proto:UnitInstanceClient){
        let typeId = proto.typeId();
        this.registry[typeId]=proto;
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