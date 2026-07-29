import { DB } from "../../../../Zing3/share/DB";
import { DataInstanceId, ParamValueJSON, StepInstanceJSON, UnitInstanceJSON, UnitTypeId } from "../../common/WorkbookJSON";
import { UnitClient } from "./UnitClient";
import { WorkbookClient } from "./WorkbookClient";



export class UnitInstanceClient {
    workbook:WorkbookClient;
    constructor(workbook:WorkbookClient){
        this.workbook=workbook;
    }
    unitTypeId:UnitTypeId=";"
    protected unit?:UnitClient;
    instanceId="";
    paramValue:ParamValueJSON={}
    protected row=-1;
    protected col=-1;
    note="";
    inputs:{id:string,dataId?:DataInstanceId}[]=[]
    outputs:{id:string,dataId?:DataInstanceId}[]=[]
    
    getCell():{row:number,col:number} {
        return {row:this.row,col:this.col};
    }
    setCell(row:number,col:number){
        this.row=row;
        this.col=col;
    }
    fromJSON(json:UnitInstanceJSON){
        this.unitTypeId=json.unitTypeId;
        this.resolveUnit();
        this.instanceId=json.instanceId;
        this.row = json.row;
        this.col = json.col;
        this.paramValue=json.paramValue;
        this.inputs=json.inputs;
        this.outputs=json.outputs;
        this.note = json.note;
    }

    
    resolveUnit(){
        let unit = UnitClient.getUnit(this.unitTypeId);
        if (!unit){
            DB.msg(`stepId ${this.unitTypeId} does not exist`)
            return;
        }
        this.unit=unit;
    }
    toJSON():UnitInstanceJSON{
        let rslt:UnitInstanceJSON = {
            unitTypeId:this.unitTypeId,
            instanceId:this.instanceId,
            paramValue:this.paramValue,
            row:this.row,
            col:this.col,
            inputs:this.inputs,
            outputs:this.outputs,
            note:this.note
        }
        return rslt;
    }

}