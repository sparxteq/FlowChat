import { DB } from "../../../../Zing3/share/DB";
import { Log } from "../../client/log/Log";
import { TableMem } from "../../common/TableMem";
import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { ZDict, ZT } from "../../common/ZT";
import { FilesFS } from "../files/FilesFS";
import { MSSelectSieve, MSSieveData } from "../MZML/MSSelectSieve";
import { MZMLParser } from "../MZML/MZMLParser";
import { MassSpecData } from "../tables/MassSpecData";
import { ReadTableCSV } from "../tables/ReadTableCSV";
import { WriteTableZMS } from "../tables/WriteTableZMS";
import { WorkNotify } from "../workers/WorkNotify";
import { WorkServer } from "../WorkServer";
import { ParseAllDataPointsParam } from "./ParseAllDataPoints";
import { StudySpecificationParam } from "./StudySpecification";
import { Unit } from "./Unit";



export class ParseSelectedDataPoints extends Unit{
    description(): string {
        return `This will parse all of the source files referenced in the assembly file,
                but will only retain the selected features for each of them`;
    }
    paramType(): ZT {
        return new ZDict();
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return [
            {inputId:"examplesToParse",typeName:this.checkType("CSV")},
            {inputId:"features",typeName:this.checkType("CSV")},
            {inputId:"quanta",typeName:this.checkType("JSON")}
        ]
    }
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [
            {outputId:"sampleData.zms",typeName:this.checkType("ZMS")},
            {outputId:"stats.json",typeName:this.checkType("JSON")}
        ]
    }
    defaultParam() {
        return {};
    }
    private wnote:WorkNotify=<any>undefined;
    async run(instanceInfo: StepRunJSON, log: Log): Promise<boolean> {
        this.wnote = new WorkNotify(log)
        debugger

        let exTableName = this.inputFileName("examplesToParse",instanceInfo);
        let exTable = new ReadTableCSV(exTableName);
        await exTable.openR();
        let exMem = await this.readToMem(exTable);

        let featuresName = this.inputFileName("features",instanceInfo);
        let featuresTable = new ReadTableCSV(featuresName);
        await featuresTable.openR();
        let inQuantaName = this.inputFileName("quanta",instanceInfo)
        let inQuantaFile = new FilesFS(inQuantaName);
        await inQuantaFile.openR();
        let inQuantStr = await inQuantaFile.readAll()
        let inQuanta = JSON.parse(inQuantStr);
        let quanta:MSSieveData={
            srcId:"",
            mz:inQuanta.mzBinWidth,
            rt:inQuanta.rtBinWidth,
            im:inQuanta.imBinWidth,
            ms2:-1
        }
        let sieve = await this.buildSieveFromFeatures(featuresTable,quanta);

        let zmsTableName = this.outputFileName("sampleData.zms",instanceInfo);
        let zmsTable = new WriteTableZMS(zmsTableName);
        zmsTable.setQuanta(quanta.rt,quanta.im,quanta.mz);
        zmsTable.setSieve(sieve);
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
        return true;
    }
    private projectFolderName="";
    private async readToMem(table:ReadTableCSV):Promise<TableMem>{
        let mem = new TableMem();
        let colTypes = table.getColTypes();
        mem.setColTypes(colTypes);
        let row = await table.nextRow();
        while (row){
            mem.addRow(row);
            row = await table.nextRow();
        }
        return mem;
    }
    private async buildSieveFromFeatures(featuresTable:ReadTableCSV,quanta:MSSieveData):Promise<MSSelectSieve>{
        
        let sieve = new MSSelectSieve(quanta);
        let row = await featuresTable.nextRow();
        while(row){
            let d:MSSieveData={
                srcId:row[1],
                rt:row[2],
                im:row[3],
                mz:row[4],
                ms2:row[5]
            }
            sieve.addInBucket(d);
            row = await featuresTable.nextRow();
        }
        return sieve;
    }
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
}