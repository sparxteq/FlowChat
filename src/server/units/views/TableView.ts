
import { TypeName, StepRunJSON } from "../../../common/WorkbookJSON";
import { Unit } from "../Unit";
import { ZT, ZDict } from "../../../common/ZT";



export class TableView extends Unit{
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
    
}