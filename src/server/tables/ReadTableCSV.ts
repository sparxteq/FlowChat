import { ZField, ZAny } from "../../common/ZT";
import { FilesFS } from "../files/FilesFS";
import { ReadTable } from "./ReadTable";
import { WriteTable } from "./WriteTable";




export class ReadTableCSV extends ReadTable{
    private isOpen=false;
    protoCopy(fileName:string): ReadTable {
        let cp = new ReadTableCSV(fileName);
        return cp;
    }
    getExtension(): string {
        return "csv";
    }
    async openR(): Promise<void> {
        //DB.start("ReadTableCSV.open")
        if (this.isOpen)
            return;
        //DB.msg("this.fileName",this.fileName)
        this.file=new FilesFS(this.fileName)
        if (this.file){
            //DB.msg("is this.file")
            this.isOpen=true;
            await this.file.openR();
            await this.readColHeaders();
        }
        //DB.end()
    }
    protected async readColHeaders():Promise<void>{
        //DB.start("ReadTableCSV.readColHeaders")
        let cols:ZField[]=[];
        if (this.file){
            let headers = await this.file.readln();
            let names = headers.split(",");
            //DB.msg("names",names)
            for (let name of names){
                let decName = WriteTable.names.decode(name).trim();
                let col=new ZField(decName,new ZAny());
                cols.push(col);
            }
            this.setColTypes(cols);
        } 
        //DB.end();
    }
    async close(): Promise<void> {
        this.isOpen=false;
        if (this.file){
            await this.file.close();
            this.file=undefined;
        }
    }
    async nextRow(): Promise<any[] | null> {
        if (this.file){
            let line = await this.file.readln();
            if (!line || line.length==0)
                return null;
            let valStrs = line.split(",");
            let vals:any[]=[];
            for (let valStr of valStrs){
                let valN = Number.parseFloat(valStr)
                if (isNaN(valN)){
                    let decVal = WriteTable.names.decode(valStr)
                    let pv:any=decVal;
                    if (decVal=="true"){
                        pv=true
                    } else if (decVal=="false"){
                        pv=false
                    } else {
                        let tv = decVal.trim();
                        if (tv[0]=="[" || tv[0]=="{"){
                            let json = JSON.parse(tv);
                            pv=json;
                        } 
                    }
                    vals.push(pv)
                } else {
                    vals.push(valN)
                }
            }
            this.rowCount++;
            return vals;
        }
        return null;
    }
    async readToStr():Promise<string>{
        await this.openR();
        let types = this.getColTypes();
        let colNames:string[] = [];
        for (let t of types){
            let name =t.fieldName;
            colNames.push(name);
        }
        let csvLines:string[]=[]
        let headers = colNames.join(",");
        csvLines.push(headers);
        let row = await this.nextRow();
        while(row){
            let rowLine = this.rowLine(row);
            csvLines.push(rowLine)
            row = await this.nextRow();
        }
        let csvStr = csvLines.join("\n");
        return csvStr;
    }
        private rowLine(row:any[]):string{
            let conts:string[]=[];
            for (let item of row){
                if (typeof item == "number")
                    conts.push(item.toString())
                else if (typeof item == "string")
                    conts.push(item)
                else
                    conts.push("")
            }
            let rslt = conts.join(",")
            return rslt;
        }
}