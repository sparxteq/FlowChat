import { Names } from "../../common/Names";
import { TableAb } from "./TableAb";



export abstract class WriteTable extends TableAb{
    
    protected fullSourceId:string;
    protected rowCount=0;
    static names = new Names('<>:\n,"')
    constructor(fullSourceId:string){
        super();
        this.fullSourceId = WriteTable.names.encode(fullSourceId);
    }

    abstract getExtension():string;
    abstract openW():Promise<void>;
    abstract close():Promise<void>;
    nRows(): number {
        return this.rowCount;
    }
    nextRow(): Promise<any[] | null> {
        throw new Error("nextRow not allowed on WriteTable");
    }
    startRows(): void {
        throw new Error("startRows not allowed on WriteTable");
    }
}