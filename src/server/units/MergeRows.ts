import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { Unit } from "./Unit";
import { ZT, ZDict } from "../../common/ZT";




export class MergeRows extends Unit{
    description(): string {
        return `Takes two tables and merges their columns and their rows`;
    }
    paramType(): ZT {
        return new ZDict()
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return [ {inputId:"tableA",typeName:this.checkType("table")},
            {inputId:"tableB",typeName:this.checkType("table")}
        ]
    }
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [
            {outputId:"merged",typeName:this.checkType("table")}
        ]
    }
    run(instanceInfo: StepRunJSON): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    
}