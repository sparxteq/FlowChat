import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { Unit } from "./Unit";
import { ZT, ZDict, ZString, ZField, ZNumber } from "../../common/ZT";
import { DB } from "../../../../Zing3/share/DB";
import { WriteTableCSV } from "../tables/WriteTableCSV";
import { randomInt } from "../../common/Random";




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
        return [ {outputId:"table.csv",typeName:this.checkType("table")}]
    }
    async run(instanceInfo: StepRunJSON): Promise<boolean> {
        let outFileName = this.outputFileName("table.csv",instanceInfo);
        let table = new WriteTableCSV(outFileName)
        let param = <RandomTableParam>instanceInfo.paramValue;
        let colTypes:ZField[]=[];
        for (let colName of param.columnNames){
            let ct = new ZField(colName,new ZNumber())
            colTypes.push(ct)
        }
        table.setColTypes(colTypes);
        await table.openW()
        let random = randomInt(param.seed,100,500)
        for (let rowI = 0;rowI<param.nRows;rowI++){
            let row:number[]=[];
            for (let col of param.columnNames){
                row.push(random())
            }
            table.addRow(row)
        }
        table.close();
        return true;
    }
    
}
type RandomTableParam = {
    seed:number,
    columnNames:string[],
    nRows:number;
}