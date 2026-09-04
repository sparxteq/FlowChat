import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { Unit } from "./Unit";
import { ZT, ZDict, ZString } from "../../common/ZT";
import { DB } from "../../../../Zing3/share/DB";




export class RandomTable extends Unit{
    /*unitTypeId(): string {
        return "RandomTable"
    }*/
    description(): string {
        return `Generates a table with a specified number of rows and columns with
            random contents for the cells`;
    }
    paramType(): ZT {
        return new ZDict()
            .num("seed")
            .array("columnNames",new ZString())
            .num("nRows")
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return []
    }
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [ {outputId:"table",typeName:this.checkType("table")}]
    }
    async run(instanceInfo: StepRunJSON): Promise<boolean> {
        DB.msg("RandomTable.run",instanceInfo);
        let outFile = this.outputFile("table",instanceInfo);
        
        return true;
    }
    
}