import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { curUser, HTTPCSVGetResult } from "../../common/http/httpTypes";
import { TableMem } from "../../common/TableMem";
import { http } from "../http/ClientHTTP";
import { DisplayCellView } from "../views/workbook/DisplayCellView";
import { SheetView } from "../views/workbook/SheetView";
import { UnitCellView } from "../views/workbook/UnitCellView";
import { FlowSheetClient } from "./FlowSheetClient";
import { UnitInstanceClient } from "./UnitInstanceClient";



export abstract class DisplayInstanceClient extends UnitInstanceClient{
    constructor(flowSheet?:FlowSheetClient){
        super(flowSheet)
        let inputTypes = this.inputTypes();
        this.inputSources=[];
        for (let inputId in inputTypes){
            this.inputSources.push({id:inputId})
        }
    }
    unitType():string{
        return "view";
    }
    cellView(sheetView:SheetView): UnitCellView {
        return new DisplayCellView(this,sheetView);
    }
    
    resolveType(): void {
        
    }
    async computeDisplay():Promise<ZUI>{
        let name = this.constructor.name;
        return new TextUI(`display ${name} not override`).style("col-12")
    }
    async getVarCSV(inputId:string):Promise<TableMem | string>{
        let inputSource = this.inputSource(inputId)
        let wb = this.workbook;
        let wbId = wb.workbook;
        let email = wb.userEmail;
        let projId = wb.project;
        let actId = wb.activity;
        let instId = inputSource.instance.instanceId;
        let outputId = inputSource.outputId
        let csvRslt = await http.varGetCSV(email,actId,projId,wbId,instId,outputId);
        if (csvRslt.success){
            let csvStr = <string>csvRslt.data.csv;
            let table = new TableMem()
            table.fromString(csvStr);
            return table;
        } else {
            return <string>csvRslt.msg;
        }
    }
}

export type StepViewSelections = StepViewSelection[];
export type StepViewSelection = {
    columnId:string,
    selectVal:string | number
}