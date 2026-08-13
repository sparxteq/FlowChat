import { StepInstanceJSON } from "../../common/WorkbookJSON";
import { ZT } from "../../common/ZT";
import { SheetView } from "../views/workbook/SheetView";
import { StepCellView } from "../views/workbook/StepCellView";
import { FlowSheetClient } from "./FlowSheetClient";
import { UnitClient } from "./UnitClient";
import { UnitInstanceClient } from "./UnitInstanceClient";



export class StepInstanceClient extends UnitInstanceClient {
    
    
    private _typeId:string;
    typeId():string{
        return this._typeId;
    }
    unitType():string{
        return "step";
    }
    constructor(typeId:string,flowSheet:FlowSheetClient){
        super(flowSheet);
        this._typeId=typeId;
    }
    unitClient:UnitClient=<any>undefined;
    resolveType(){
        this.unitClient=UnitClient.getUnit(this.typeId())
    }
    paramType():ZT{
        return this.unitClient.paramType
    }
    inputTypes(): { [inputId: string]: string; } {
        let inputTypes = this.unitClient.inputTypes;
        let rslt:{[inputId:string]:string}={};
        for (let inputType of inputTypes){
            rslt[inputType.inputId]=inputType.typeName;
        }
        return rslt;
    }
    cellView(sheetView:SheetView):StepCellView{
        return new StepCellView(this,sheetView)
    }
    outputType(outputId:string):string | undefined{
        let unit = <UnitClient>this.unitClient
        let outputs=unit.outputTypes;
        for (let o of outputs){
            if (o.outputId==outputId)
                return o.typeName;
        }
    }
    outputFile(sheet:FlowSheetClient,outputId:string):string{
        let unit = <UnitClient>this.unitClient
        let outputs=unit.outputTypes;
        for (let o of outputs){
            if (o.outputId==outputId){
                let path = sheet.varFilePath();
                return path+"/"+outputId;
            }
        }
        return ""
    }
    make(flowSheet:FlowSheetClient): UnitInstanceClient {
        let inst =  new StepInstanceClient(this.typeId(),flowSheet);
        inst.resolveType();
        return inst;
    }
    fromJSON(json:StepInstanceJSON){
        super.fromJSON(json);
        if (json.flowSheet)
            this.flowSheet=FlowSheetClient.fromJSON(json.flowSheet,this.workbook)
    }
    toJSON():StepInstanceJSON{
        let rslt = <StepInstanceJSON>super.toJSON()
        rslt.flowSheet = this.flowSheet.toJSON();
        return rslt;
    }

}