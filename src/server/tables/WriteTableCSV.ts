import { ZField } from "../../common/ZT";
import { FilesFS } from "../files/FilesFS";
import { TableAb } from "./TableAb";
import { WriteTable } from "./WriteTable";


export class WriteTableCSV extends WriteTable{
    protoCopy(fileName: string): WriteTable {
        return new WriteTableCSV(fileName);
    }
    protected copy(): TableAb {
        let fn = this.fullSourceId;
        return this.protoCopy(fn);
    }
    getExtension(): string {
        return "csv";
    }
    protected file?:FilesFS;
    async openW(): Promise<void> {
        let cols = this.getColTypes();
        this.file = new FilesFS(this.fullSourceId);
        if (this.file){
            await this.file.openW(true);
            await this.writeColHeaders(cols);

        }
    }
    protected async writeColHeaders(cols:ZField[]):Promise<void>{
        let first=true;
        let headers="";
        for (let col of cols){
            let name = WriteTable.names.encode(col.fieldName);
            if (first){
                headers+=name;
                first=false;
            } else {
                headers+=","+name
            }
        }
        await (<FilesFS>this.file).writeln(headers);
    }
    async close(): Promise<void> {
        if (this.file){
            await this.file.close()
            this.file=undefined;
        }
    }
    addRow(columnValues: any[]): void {
        if (this.file){
            let vals:string[]=[];
            for (let cv of columnValues){
                let cvs = cv.toString();
                if (typeof cv == "string"){
                    cvs = WriteTable.names.encode(cv);
                } else if (typeof cv == "object"){
                    cvs = JSON.stringify(cv);
                    cvs = WriteTable.names.encode(cvs);
                }
                vals.push(cvs)
            }
            let line = vals.join(",");
            this.file.writelnSync(line);
            this.rowCount++;
        }
    }
    
}
