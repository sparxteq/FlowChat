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
}