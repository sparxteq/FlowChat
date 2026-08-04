import { StepInstanceJSON } from "../../common/WorkbookJSON";
import { StepCellView } from "../views/workbook/StepCellView";
import { FlowSheetClient } from "./FlowSheetClient";
import { UnitClient } from "./UnitClient";
import { UnitInstanceClient } from "./UnitInstanceClient";
import { WorkbookClient } from "./WorkbookClient";



export class StepInstanceClient extends UnitInstanceClient {
    private _typeId:string;
    typeId():string{
        return this._typeId;
    }
    constructor(typeId:string,flowSheet:FlowSheetClient){
        super(flowSheet);
        this._typeId=typeId;
    }
    flowSheet:FlowSheetClient=<any>undefined;
    unitClient:UnitClient=<any>undefined;
    resolveType(){
        this.unitClient=UnitClient.getUnit(this.typeId())
    }
    cellView():StepCellView{
        return new StepCellView(this)
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
        return new StepInstanceClient(this.typeId(),flowSheet);
    }
    fromJSON(json:StepInstanceJSON){
        super.fromJSON(json);
        this.outputs=json.outputs;
        if (json.flowSheet)
            this.flowSheet=FlowSheetClient.fromJSON(json.flowSheet,this.workbook)
    }
    toJSON():StepInstanceJSON{
        let rslt = <StepInstanceJSON>super.toJSON()
        rslt.outputs = this.outputs;
        rslt.flowSheet = this.flowSheet.toJSON();
        return rslt;
    }

}