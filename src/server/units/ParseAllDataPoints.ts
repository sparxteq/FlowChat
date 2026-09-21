import { Log } from "../../client/log/Log";
import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { ZDict, ZT } from "../../common/ZT";
import { FilesFS } from "../files/FilesFS";
import { ReadTableCSV } from "../tables/ReadTableCSV";
import { TableMem } from "../../common/TableMem"
import { WriteTableZMS } from "../tables/WriteTableZMS";
import { Unit } from "./Unit";
import { WorkServer } from "../WorkServer";
import { MassSpecData } from "../tables/MassSpecData";
import { MZMLParser } from "../MZML/MZMLParser";
import { WorkNotify } from "../workers/WorkNotify";
import { DB } from "../../../../Zing3/share/DB";
import { WriteTableCSV } from "../tables/WriteTableCSV";



export class ParseAllDataPoints extends Unit{
    description(): string {
        return `parses all of the files referenced in the example file. It builds
            a ZMS file that contains all of the features from all of the files.
            This can get quite large so this is generally preceeded by a sampling
            step to use just 20-100 examples to keep the memory demands in check`;
    }
    paramType(): ZT {
        return new ZDict()
            .num("mzBinWidth",{decimals:4})
            .num("rtBinWidth",{decimals:1})
            .num("imBinWidth",{decimals:2});
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return [
            {inputId:"examples",typeName:this.checkType("CSV")}
        ];
    }
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [
            {outputId:"sampleData.zms", typeName:this.checkType("ZMS")},
            {outputId:"stats.json", typeName:this.checkType("JSON")},
            {outputId:"quanta.json", typeName:this.checkType("JSON")}
        ]
    }
    defaultParam():ParseAllDataPointsParam {
        return {
            mzBinWidth:0.1,
            rtBinWidth:20,
            imBinWidth:-1
        }
    }
    private wnote:WorkNotify=<any>undefined;
    async run(instanceInfo: StepRunJSON, log: Log): Promise<boolean> {
        //debugger;
        this.wnote = new WorkNotify(log);
        let param = <ParseAllDataPointsParam>instanceInfo.paramValue;
        let mzBin = param.mzBinWidth;
        let rtBin = param.rtBinWidth;
        let imBin = param.imBinWidth;
    
        let exTableName = this.inputFileName("examples",instanceInfo);
        let exTable = new ReadTableCSV(exTableName);
        await exTable.openR();
        let exMem = await this.readExamples(exTable);

        let quantName = this.outputFileName("quanta.json",instanceInfo)
        let quantFile = new FilesFS(quantName);
        let quantStr = JSON.stringify(param);
        await quantFile.openW();
        await quantFile.write(quantStr)
        let zmsTableName = this.outputFileName("sampleData.zms",instanceInfo);
        let zmsTable = new WriteTableZMS(zmsTableName);
        zmsTable.setQuanta(rtBin,imBin,mzBin);
        await zmsTable.openW();
        let ii = instanceInfo;
        this.projectFolderName=WorkServer.projFolderName(
            ii.userEmail,ii.actId,ii.projId)

        let nRows = exMem.nRows();
        let row = await exMem.nextRow();
        let rowCount=0;
        while (row){
            rowCount++;
            let [exampleId,sourceId,sourceFile,outcome]=row;
            DB.msg(`${exampleId}:${sourceId}::${sourceFile} ${rowCount}/${nRows}`)
            log.status(`${exampleId}:${sourceId}::${sourceFile} ${rowCount}/${nRows}`)
            log.start(sourceFile);
            try {
                await this.parseFile(exampleId,sourceId,sourceFile,outcome,zmsTable,rowCount,nRows)
            } catch (e:any){
                log.msg(`*** exception ${e.message}`)
                DB.msg("stack",e.stack())
            }
            log.end(sourceFile)
            row = await exMem.nextRow();
        }

        let statsName = this.outputFileName("stats.json",instanceInfo);
        let stats = new FilesFS(statsName);
        await stats.openW();
        let statsData = zmsTable.data!.getStats();
        let statsStr = JSON.stringify(statsData);
        await stats.writeln(statsStr);

        await exTable.close();
        await zmsTable.close();
        await stats.close();
        await quantFile.close();
        return true;
    }
    private projectFolderName:string=""
    private correctlyParsed=0;
    private async parseFile(exampleId:string,sourceId:string,sourceFile:string
            ,outcome:string,zmsTable:WriteTableZMS,rowCount:number,nRows:number):Promise<void>{
        let fn = `${this.projectFolderName}/_sources/${sourceFile}`
        zmsTable.addOutCome(exampleId,outcome);
        let srcFile = new FilesFS(fn);
        if (srcFile){
            let parser = new MZMLParser(<MassSpecData>zmsTable.data,this.wnote)
            await parser.parseData(this.projectFolderName,srcFile,{
                exampleId:exampleId,sourceId:sourceId,sourceFile:sourceFile,outcome:outcome
            },rowCount,nRows)
        }
    }
    private async readExamples(exTable:ReadTableCSV):Promise<TableMem>{
        let mem = new TableMem();
        let colTypes = exTable.getColTypes();
        mem.setColTypes(colTypes);
        let row = await exTable.nextRow();
        while (row){
            mem.addRow(row);
            row = await exTable.nextRow();
        }
        return mem;
    }
    
}
export type ParseAllDataPointsParam = {
    mzBinWidth:number,
    rtBinWidth:number,
    imBinWidth:number
}
export type ParseAllDataPointsRow = {
    exampleId:string,
    sourceId:string,
    sourceFile:string,
    outcome:string;
}