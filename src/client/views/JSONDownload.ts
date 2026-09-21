import { DB } from "../../../../Zing3/share/DB";
import { ButtonUI } from "../../../../Zing3/zui/ButtonUI";
import { Modal } from "../../../../Zing3/zui/Modal";
import { ZUI } from "../../../../Zing3/zui/ZUI";



export class JSONDownload extends ZUI{
    constructor(json:string,name:string){
        super();
        let downloadName = name;
        if (downloadName.indexOf(".json")<0)
            downloadName=name+".json"
        let jsonButton = new ButtonUI(`>> ${downloadName}`).click(()=>{
            
            DB.msg(`export to ${downloadName}`)
            let fullJson = JSON.parse(json);
            let prettyJson = JSON.stringify(fullJson,null,4)
            let file = new Blob([prettyJson],{type:"text/plain"});
            let a = document.createElement("a");
            a.href = URL.createObjectURL(file);
            a.download=downloadName
            a.click();
            Modal.alert(`Check your browser's downloads for a file called "<b>${downloadName}</b>"`)
        }).style("TableDownload")
        this.content=jsonButton;
    }
}