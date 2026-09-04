import { Log } from "../../client/log/Log";
import { ZField, ZCode } from "../../common/ZT";
import { FilesFS } from "../files/FilesFS";
import { MassSpecData, MsRecord, MsFeature } from "./MassSpecData";
import { ReadTable } from "./ReadTable";




export class ReadTableZMS extends ReadTable{
    data?:MassSpecData;
    getExtension(): string {
        return "zms";
    }
    private isOpen=false;
    private exampleIds:string[]=[]
    async openR(): Promise<void> {
        if (this.isOpen)
            return;
        this.file = new FilesFS(this.fileName);
        if (this.file){
            this.isOpen=true
            await this.file.openR();
            await this.readColHeaders();
            let colTypes = this.getColTypes();
            let imHead = colTypes[2]
            let rtHead = colTypes[3];
            let mzHead = colTypes[4];
            let imQuantum = <number>imHead.info.quantum;
            let rtQuantum = <number>rtHead.info.quantum;
            let mzQuantum = <number>mzHead.info.quantum;
            this.data = new MassSpecData(rtQuantum,imQuantum,mzQuantum)
            if (this.data){
                this.exampleIds = this.getExampleIds();
                this.data.exampleIds=this.exampleIds;
            }
        }
    }
    log:Log=<Log><any>undefined;
   async processRows(processRow:(rowRec:{[columnName:string]:any})=>Promise<void>):Promise<void>{
        this.rFile = <FilesFS>this.file;
        this.processRow = processRow;
        let nextLine = this.readSrc();
        while (nextLine[0] == "{"){
            nextLine = this.readSrc();
        }
    }
    private rFile:FilesFS=<FilesFS><any>undefined;
    private processRow:ProcessRow=<ProcessRow><any>undefined;
    private srcId="";
    private im=-1;
    private rt=-1;
    private mz=-1;
    private ms2=-1;
    private readSrc():string{
        let nextLine = this.rFile.readlnSync();
        while (nextLine[0] =="{"){
            this.srcId=nextLine.substring(1);
            nextLine = this.readIm();
        }
        if (nextLine[0]=="}")
            return this.rFile.readlnSync();
        else
            return "??"
    }
    private readIm():string{
        let nextLine = this.rFile.readlnSync();
        while (nextLine[0] =="{"){
            let str =nextLine.substring(1);
            this.im = Number.parseFloat(str);
            nextLine = this.readRT();
        }
        if (nextLine[0]=="}")
            return this.rFile.readlnSync();
        else
            return "??"
    }
    private rtCnt=0;
    private readRT():string{
        let nextLine = this.rFile.readlnSync();
        while (nextLine[0] =="{"){
            let str =nextLine.substring(1);
            this.rt = Number.parseFloat(str);
            if (this.log) this.log.status(`RT ${this.rt}`)
            nextLine = this.readMZ();
        }
        if (nextLine[0]=="}")
            return this.rFile.readlnSync();
        else
            return "??"
    }
    private readMZ():string{
        let nextLine = this.rFile.readlnSync();
        while (nextLine[0] =="{"){
            let str =nextLine.substring(1);
            this.mz = Number.parseFloat(str);
            nextLine = this.readms2();
        }
        if (nextLine[0]=="}")
            return this.rFile.readlnSync();
        else
            return "??"
    }
    private readms2():string{
        let nextLine = this.rFile.readlnSync();
        while (nextLine[0] =="{"){
            let str =nextLine.substring(1);
            this.ms2 = Number.parseFloat(str);
            nextLine = this.readAB();
        }
        if (nextLine[0]=="}")
            return this.rFile.readlnSync();
        else
            return "??"
    }
    private readAB():string{
        let nextLine = this.rFile.readlnSync();
        let abs:number[]=[];
        if (nextLine[0]=="{"){
            let abStr = this.rFile.readlnSync();
            while (abStr && abStr!="}" && abStr!=""){
                let ab = Number.parseFloat(abStr)
                if (Number.isNaN(ab)){
                    return "??"
                }
                abs.push(ab);
                abStr = this.rFile.readlnSync();
            }
            this.processRow({
                srcId:this.srcId,
                im:this.im,
                rt:this.rt,
                mz:this.mz,
                ms2:this.ms2,
                abs:abs
            })
            if (abStr == "}"){
                let abStr = this.rFile.readlnSync();
                return abStr;
            }
        }
        return "??"
    }
    protected async readColHeaders():Promise<void>{
        let cols:ZField[]=[];
        if (this.file){
            let headers = await this.file.readln();
            let jsonHeaders = JSON.parse(headers);
            for (let jsonField of jsonHeaders){
                let field = ZField.fromJSON(jsonField);
                cols.push(field)
            }
        }
        this.setColTypes(cols);
        this.exampleIds = this.getExampleIds();
    }
    getExampleIds():string[]{
        let exField = this.columns[0];
        let type = <ZCode>exField.type;
        let exIds:string[]=[];
        for (let codeZ of type.codes){
            let name=codeZ.name;
            exIds.push(name);
        }
        return exIds;
    }
    getOutcome(exampleId:string):string | undefined{
        let exField = this.columns[0];
        let type = <ZCode>exField.type;
        for (let codeZ of type.codes){
            if (codeZ.name==exampleId){
                let code = <number>codeZ.value
                let name="";
                if (type.info.outcomes)
                    name = type.info.outcomes[code]
                return name
            }
        }
        return 
    }
    async close(): Promise<void> {
        await this.file?.close();
    }
    next():MsRecord | undefined{
        if (this.data && this.file){
            let nd = this.data.next(this.file);
            return nd;
        } else {
            return;
        }
    }
    async nextRow(): Promise<any[] | null> {
        throw "nextRow not available on ReadTableZMS use processRows"
    }
    async nextFeature():Promise<MsFeature | undefined>{
        if(this.data && this.file){
            return await this.data.nextFeature(this.file);
        }
    }
    
    async buildData():Promise<void>{
        if(this.data && this.file){
            let exampleIds = this.getExampleIds();
            let exType = <ZCode>(this.columns[0].type);
            let outcomes = <string[]>exType.info.outcomes;
            return await this.data.buildData(this.file,exampleIds,outcomes);
        }
    }
}
type ProcessRow = (processRec:{[colName:string]:any})=>void;