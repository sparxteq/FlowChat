import { ZAny, ZField } from "../../common/ZT";
import { ReadTable } from "./ReadTable";
import { ReadTableCSV } from "./ReadTableCSV";
import { WriteTable } from "./WriteTable";



export class ReadTableCSVDesc extends ReadTableCSV{
    
    protoCopy(fileName:string): ReadTable {
        let cp = new ReadTableCSVDesc(fileName);
        return cp;
    }
    getExtension(): string {
        return "csvd"
    }
    protected async readColHeaders(): Promise<void> {
        if (this.file){
            let file = this.file;
            let tag = await file.readln()
            let cols:ZField[]=[];
            if (tag=="#WriteTableCSVDesc#"){
                let descsStr = await file.readln();
                //let dec = WriteTable.names.decode(descsStr)
                let descsStrs = descsStr.split(",");
                for (let str of descsStrs){
                    let dec = WriteTable.names.decode(str)
                    let json = JSON.parse(dec);
                    let col = ZField.fromJSON(json);
                    cols.push(col);
                }
                this.setColTypes(cols);
            } else {
                let cols:ZField[]=[];
                let headers = tag;
                let names = headers.split(",");
                for (let name of names){
                    let decName = WriteTable.names.decode(name)
                    let col=new ZField(decName,new ZAny());
                    cols.push(col);
                }
                this.setColTypes(cols);
            }
        }
    }
}