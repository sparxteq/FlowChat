
import { TypeName, StepRunJSON } from "../../../common/WorkbookJSON";
import { Unit } from "../Unit";
import { ZT, ZDict } from "../../../common/ZT";
import { DisplayInstanceClient } from "../../../client/workbook/DisplayInstanceClient";
import { UnitCellView } from "../../../client/views/workbook/UnitCellView";
import { UnitInstanceClient } from "../../../client/workbook/UnitInstanceClient";
import { WorkbookClient } from "../../../client/workbook/WorkbookClient";
import { FlowSheetClient } from "../../../client/workbook/FlowSheetClient";



export class TableView extends DisplayInstanceClient{

    description(): string {
        return `Displays a standard row / column view of a table`
    }
    paramType(): ZT {
        return new ZDict();
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return [{inputId:"table",typeName:this.checkType("table")}]
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