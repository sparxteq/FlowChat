
import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { Unit } from "../../server/units/Unit";
import { ZT, ZDict } from "../../common/ZT";
import { DisplayInstanceClient } from "../workbook/DisplayInstanceClient";
import { UnitCellView } from "./workbook/UnitCellView";
import { UnitInstanceClient } from "../workbook/UnitInstanceClient";
import { WorkbookClient } from "../workbook/WorkbookClient";
import { FlowSheetClient } from "../workbook/FlowSheetClient";



export class TableView extends DisplayInstanceClient{

    description(): string {
        return `Displays a standard row / column view of a table`
    }
    paramType(): ZT {
        return new ZDict();
    }
    inputTypes(): { [inputId: string]: string; } {
        return {
            table:this.checkType("table")
        };
    }
    
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [];
    }
    run(instanceInfo: StepRunJSON): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    
    make(flowSheet:FlowSheetClient): UnitInstanceClient {
        return new TableView(flowSheet);
    }
}