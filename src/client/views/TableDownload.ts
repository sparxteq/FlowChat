import { DB } from "../../../../Zing3/share/DB";
import { ButtonUI } from "../../../../Zing3/zui/ButtonUI";
import { DivUI } from "../../../../Zing3/zui/DivUI";
import { Modal } from "../../../../Zing3/zui/Modal";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { TableMem } from "../../common/TableMem";


export class TableDownload extends ZUI{
    private table:TableMem;
    constructor(table:TableMem,name:string){
        super();
        this.table=table;
        let downloadName = name;
        if (downloadName.indexOf(".csv")<0){
            downloadName=name+".csv";
        }
        let csvButton = new ButtonUI(`>> ${downloadName}`).click(()=>{
            DB.msg("export to ",downloadName)
            let text = this.table.toCSVString();
            let file = new Blob([text],{type:"text/plain"});
            let a = document.createElement("a");
            a.href = URL.createObjectURL(file);
            a.download= downloadName;
            a.click();
            Modal.alert(`Check your browser's downloads for a file called "<b>${downloadName}</b>"`)
        }).style("TableDownload")
        
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
        }).style("TableDownload")
        let div = new DivUI([
            csvButton,
            //jsonButton
        ])
        this.content=div;
    }
}