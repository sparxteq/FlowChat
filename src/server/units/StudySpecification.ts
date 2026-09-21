import { Log } from "../../client/log/Log";
import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { ZDict, ZField, ZString, ZT } from "../../common/ZT";
import { FilesFS } from "../files/FilesFS";
import { ReadTableCSV } from "../tables/ReadTableCSV";
import { WriteTableCSV } from "../tables/WriteTableCSV";
import { Unit } from "./Unit";



export class StudySpecification extends Unit{
    description(): string {
        return `Collects study parameters and verifies them with the assembly file`;
    }
    paramType(): ZT {
        return new ZDict()
                    .str("exampleColumn",{desc:`the column the identifies the example for
                                    each row`})
                    .str("outcomeColumn",{desc:`the column that contains the outcome
                                    for this row`})
                    .array("sourceColumns",new ZString(),{desc:`each of the columns that
                                    references a source file`})
                    .code("decisions",[
                        "FirstToEach",
                        "EachToNext",
                        "EachToEach",
                        "EachToOthers"
                    ],{desc:`How decisions are generated when there are more than 2 outcomes:
                                FirstToEach: first outcome to each other outcome
                                EachToNext: Each outcome to the one that follows. This is for series
                                EachToEach: Each outcome to each other outcome. All combinations
                                EachToOthers: Each outcome to all of the others combined`})
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return [ {inputId:"assembly",typeName:this.checkType("CSV")}
        ];
    }
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [
            {outputId:"Decisions.csv",typeName:this.checkType("CSV")},
            {outputId:"studySpec.json",typeName:this.checkType("JSON")}
            //{outputId:"ColumnData.csv",typeName:this.checkType("CSV")}
        ];
    }
    defaultParam():StudySpecificationParam {
        return {
            exampleColumn:"exampleId",
            outcomeColumn:"outcome",
            sourceColumns:["MZML"],
            decisions:"FirstToEach"     
        };
    }
    async run(instanceInfo: StepRunJSON, log: Log): Promise<boolean> {
        let goodRun = true;
        let param = <StudySpecificationParam>instanceInfo.paramValue;
        let exCol = param.exampleColumn;
        let outCol = param.outcomeColumn;
        let srcCols = param.sourceColumns;
        let decisions = param.decisions;
        let assemName = this.inputFileName("assembly",instanceInfo);
        let assemTable = new ReadTableCSV(assemName)
        await assemTable.openR();
        let exIdx = assemTable.columnIdx(exCol)
        if (exIdx<0){
            log.msg(`Example column ${exCol} not found in Assembly`)
            goodRun=false;
        }
        let outIdx = assemTable.columnIdx(outCol)
        if (outIdx<0){
            log.msg(`Example column ${outCol} not found in Assembly`)
            goodRun=false;
        }
        if (srcCols.length<1){
            log.msg(`No Source columns specified`)
            goodRun=false;
        } else {
            for (let src of srcCols){
                let srcIdx = assemTable.columnIdx(src);
                if (srcIdx<0){
                    log.msg(`Source column ${src} not found in Assembly`)
                    goodRun=false;
                }
            }
        }
        if (!goodRun)
            return false;
        let specName = this.outputFileName("studySpec.json",instanceInfo)
        let specFile = new FilesFS(specName);
        await specFile.openW();
        let specStr = JSON.stringify(param);
        await specFile.write(specStr);

        let decTableN = this.outputFileName("Decisions.csv",instanceInfo)
        let decTable = new WriteTableCSV(decTableN)
        decTable.setColTypes([
            new ZField("outcomeA",new ZString()),
            new ZField("outcomeB",new ZString())
        ])
        
        let colIdx=this.colIdx(assemTable.getColTypes())
        let outcomes:{[outcome:string]:boolean}={};
        let row = await assemTable.nextRow();
        while (row){
            let exId = row[colIdx[exCol]];
            let outcome = row[colIdx[outCol]];
            outcomes[outcome]=true;
            row = await assemTable.nextRow();
        }
        await decTable.openW();
        await this.buildDecisionTable(decTable,Object.keys(outcomes),decisions)
        await decTable.close();
        await assemTable.close();
        await specFile.close();
        return true;
    }
    private async buildDecisionTable(decisionTable:WriteTableCSV,outcomes:string[],comparison:string):Promise<void>{
        outcomes.sort((a,b)=>{
            return a.localeCompare(b)
        })
        switch (comparison){
            case "FirstToEach":
                let first = outcomes[0];
                for (let eachIdx=1;eachIdx<outcomes.length;eachIdx++){
                    let each = outcomes[eachIdx];
                    decisionTable.addRow([first,each])
                }
                break;
            case "EachToNext":
                for (let eachIdx=0;eachIdx<outcomes.length-1;eachIdx++){
                    let each = outcomes[eachIdx];
                    let next = outcomes[eachIdx+1];
                    decisionTable.addRow([each,next])
                }
                break;
            case "EachToEach":
                for (let baseIdx=0;baseIdx<outcomes.length-1;baseIdx++){
                    let base = outcomes[baseIdx];
                    for (let nextIdx=baseIdx+1;nextIdx<outcomes.length;nextIdx++){
                        let next = outcomes[nextIdx];
                        decisionTable.addRow([base,next])
                    }
                }
                break;
            case "EachToOthers":
                for (let each of outcomes){
                    decisionTable.addRow([each,"*"])
                }
                break;
        }
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
export type StudySpecificationParam = {
    exampleColumn:string,
    outcomeColumn:string,
    sourceColumns:string[],
    decisions:string
}