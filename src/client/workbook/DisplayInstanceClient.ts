import { DisplayCellView } from "../views/workbook/DisplayCellView";
import { UnitCellView } from "../views/workbook/UnitCellView";
import { FlowSheetClient } from "./FlowSheetClient";
import { UnitInstanceClient } from "./UnitInstanceClient";



export abstract class DisplayInstanceClient extends UnitInstanceClient{
    cellView(): UnitCellView {
        return new DisplayCellView(this);
    }
    
    resolveType(): void {
        
    }
}