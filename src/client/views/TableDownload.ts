import { DB } from "../../../../Zing3/share/DB";
import { ButtonUI } from "../../../../Zing3/zui/ButtonUI";
import { DivUI } from "../../../../Zing3/zui/DivUI";
import { Modal } from "../../../../Zing3/zui/Modal";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { TableMem } from "../../common/TableMem";


export class TableDownload extends ZUI{
    private table:TableMem;
    constructor(table:TableMem,downloadName:string){
        super();
        this.table=table;
        let csvButton = new ButtonUI(`>> ${downloadName}.csv`).click(()=>{
            DB.msg("export to ",downloadName+".csv")
            let text = this.table.toCSVString();
            let file = new Blob([text],{type:"text/plain"});
            let a = document.createElement("a");
            a.href = URL.createObjectURL(file);
            a.download= downloadName+".csv";
            a.click();
            Modal.alert(`Check your browser's downloads for a file called "${downloadName}.csv"`)
        }).style("col-6")
        
        let jsonButton = new ButtonUI(`>> ${downloadName}.json`).click(()=>{
            DB.msg("export to ",downloadName+".json")
            let json = this.table.toJSON();
            let text = JSON.stringify(json);
            let file = new Blob([text],{type:"text/plain"});
            let a = document.createElement("a");
            a.href = URL.createObjectURL(file);
            a.download= downloadName+".json";
            a.click();
            Modal.alert(`Check your browser's downloads for a file called "${downloadName}.json"`)
        }).style("col-6")
        let div = new DivUI([
            csvButton,
            //jsonButton
        ])
        this.content=div;
    }
}