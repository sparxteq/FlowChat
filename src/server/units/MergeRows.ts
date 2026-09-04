import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { Unit } from "./Unit";
import { ZT, ZDict, ZField } from "../../common/ZT";
import { ReadTableCSV } from "../tables/ReadTableCSV";
import { WriteTableCSV } from "../tables/WriteTableCSV";




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
            {outputId:"merged.csv",typeName:this.checkType("table")}
        ]
    }
    async run(instanceInfo: StepRunJSON): Promise<boolean> {
        let tableAName = this.inputFileName("TableA",instanceInfo)
        let tableA = new ReadTableCSV(tableAName);
        await tableA.openR()
        let tableBName = this.inputFileName("TableB",instanceInfo);
        let tableB = new ReadTableCSV(tableBName);
        await tableB.openR();
        let  mergedName = this.outputFileName("merged.csv",instanceInfo);
        let merged = new WriteTableCSV(mergedName)
        let mergedCols=this.mergeCols(tableA,tableB)
        merged.setColTypes(mergedCols);
        await merged.openW()
        let aToMerged:{[colIdx:number]:number}={}
        let aTypes = tableA.getColTypes();
        for (let ai =0;ai<aTypes.length;ai++){
            let at=aTypes[ai]
            let mi = merged.columnIdx(at.fieldName)
            aToMerged[ai]=mi;
        }
        let row = await tableA.nextRow();
        while (row){
            let mergeRow:any[]=[];
            for (let ai in row){
                mergeRow[aToMerged[ai]]=row[ai]
            }
            await merged.addRow(mergeRow)
            row = await tableA.nextRow();
        }
        let bToMerged:{[colIdx:number]:number}={}
        let bTypes = tableB.getColTypes();
        for (let bi =0;bi<aTypes.length;bi++){
            let bt=bTypes[bi]
            let mi = merged.columnIdx(bt.fieldName)
            bToMerged[bi]=mi;
        }
        row = await tableB.nextRow();
        while (row){
            let mergeRow:any[]=[];
            for (let bi in row){
                mergeRow[bToMerged[bi]]=row[bi]
            }
            await merged.addRow(mergeRow)
            row = await tableB.nextRow();
        }
        await tableA.close();
        await tableB.close();
        await merged.close();
        return true;
    }
    private mergeCols(tableA:ReadTableCSV,tableB:ReadTableCSV):ZField[]{
        let aTypes = tableA.getColTypes();
        let bTypes = tableB.getColTypes();
        let rslt:ZField[]=[];
        for (let ct of aTypes){
            rslt.push(ct);
        }
        for (let bt of bTypes){
            let found=false;
            for (let at of aTypes){
                if (bt.fieldName == at.fieldName){
                    found=true;
                }
            }
            if (!found)
                rslt.push(bt);
        }
        return rslt;
    }
    
}