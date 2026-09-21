import { Log } from "../../client/log/Log";
import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { ZDict, ZField, ZString, ZT } from "../../common/ZT";
import { FilesFS } from "../files/FilesFS";
import { ReadTableCSV } from "../tables/ReadTableCSV";
import { WriteTableCSV } from "../tables/WriteTableCSV";
import { StudySpecificationParam } from "./StudySpecification";
import { Unit } from "./Unit";


export class GenerateParseList extends Unit{
    description(): string {
        return `Selects which columns from the assembly should be used for 
            which purposes when building this study`;
    }
    paramType(): ZT {
        return new ZDict()
            
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return [ {inputId:"assembly",typeName:this.checkType("CSV")},
            {inputId:"spec",typeName:this.checkType("JSON")},
        ];
    }
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [
            {outputId:"Examples.csv",typeName:this.checkType("CSV")},
        ];
    }
    defaultParam() {
        return {};
    }
    async run(instanceInfo: StepRunJSON, log: Log): Promise<boolean> {
        let assemName = this.inputFileName("assembly",instanceInfo);
        let assemTable = new ReadTableCSV(assemName)
        await assemTable.openR();
        let specName = this.inputFileName("spec",instanceInfo)
        let specFile = new FilesFS(specName);
        await specFile.openR()
        let specStr = await specFile.readAll();
        let param = <StudySpecificationParam>JSON.parse(specStr)
        let exCol = param.exampleColumn;
        let outCol = param.outcomeColumn;
        let srcCols = param.sourceColumns;

        let exTableN = this.outputFileName("Examples.csv",instanceInfo);
        let exTable= new WriteTableCSV(exTableN);
        exTable.setColTypes([
            new ZField("exampleId",new ZString()),
            new ZField("sourceId",new ZString()),
            new ZField("sourceFile",new ZString()),
            new ZField("outcome",new ZString())
        ])
        await exTable.openW();


        let colIdx=this.colIdx(assemTable.getColTypes())
        let outcomes:{[outcome:string]:boolean}={};
        let row = await assemTable.nextRow();
        while (row){
            let exId = row[colIdx[exCol]];
            let outcome = row[colIdx[outCol]];
            outcomes[outcome]=true;
            for (let src of srcCols){
                let exRow = [exId,src,row[colIdx[src]],outcome]
                await exTable.addRow(exRow);
            }
            row = await assemTable.nextRow();
        }
        await assemTable.close()
        await exTable.close()
        return true;
    }
    
    private colIdx(types:ZField[]):{[colId:string]:number}{
        let idx:{[colIdx:string]:number}={}
        for (let typeI=0;typeI<types.length;typeI++){
            let type = types[typeI]
            let name=type.fieldName;
            idx[name]=typeI;
        }
        return idx;
    }
    
}