import { DivUI } from "../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { ZDict, ZT } from "../../common/ZT";
import { DisplayInstanceClient } from "../workbook/DisplayInstanceClient";
import { FlowSheetClient } from "../workbook/FlowSheetClient";
import { UnitInstanceClient } from "../workbook/UnitInstanceClient";
import { JSONDownload } from "./JSONDownload";



export class JSONView extends DisplayInstanceClient{
    description():string{
        return `Displays a JSON value as formatted text`
    }
    paramType(): ZT {
        return new ZDict();
    }
    inputTypes(): { [inputId: string]: string; } {
        return {
            json:this.checkType("JSON")
        };
    }
    defaultParam() {
        return {};
    }
    make(flowSheet: FlowSheetClient): UnitInstanceClient {
        return new JSONView(flowSheet);
    }
    async computeDisplay():Promise<ZUI>{
        let rslt = await this.getVarJSON("json");
        let name = this.name();
        if (rslt!=""){
            let json = JSON.parse(rslt);
            let formatJSON = JSON.stringify(json,null,4);
            let text = "<pre>"+formatJSON+"</pre>"
            return new DivUI([
                new TextUI(text).style("JSONView"),
                new JSONDownload(formatJSON,name)
            ])
        } else {
            return new TextUI("*** error ***")
        }
    }
}