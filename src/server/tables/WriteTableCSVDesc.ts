import { WriteTableCSV } from "./WriteTableCSV";
import { WriteTable } from "./WriteTable";
import { ZField } from "../../common/ZT";

export class WriteTableCSVDesc extends WriteTableCSV{
    protoCopy(fileName: string): WriteTable {
        return new WriteTableCSVDesc(fileName);
    }
    getExtension(): string {
        return "csvd";
    }
    protected async writeColHeaders(cols:ZField[]):Promise<void>{
        if (this.file){
            await this.file.writeln("#WriteTableCSVDesc#")
            let first = true;
            let descs = "";
            for (let col of cols){
                let json = col.toJSON();
                let jsonStr = JSON.stringify(json);
                let str = WriteTable.names.encode(jsonStr);
                if (first){
                    descs+=str;
                    first=false;
                }else {
                    descs+=","+str;
                }
            }
            await this.file.writeln(descs);
        }
    }
}