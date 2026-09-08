import { TableAb } from "../../common/TableAb";
import { FilesFS } from "../files/FilesFS";

export abstract class ReadTable extends TableAb {
    

    protected fileName:string;
    protected file?:FilesFS
    protected rowCount=0;
    constructor(fileName:string){
        super()
        this.fileName=fileName;
    }
    abstract getExtension():string;
    abstract openR():Promise<void>;
    abstract close():Promise<void>;
    nRows(): number {
        return this.rowCount;
    }
    addRow(columnValues: any[]): void {
        throw new Error("addRow not allows on readTable");
    }
    startRows(): void {
        throw new Error("startRows not allowed on ReadTable");
    }
}