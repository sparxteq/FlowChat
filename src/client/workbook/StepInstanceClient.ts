import { StepInstanceJSON } from "../../common/WorkbookJSON";
import { FlowSheetClient } from "./FlowSheetClient";
import { UnitInstanceClient } from "./UnitInstanceClient";
import { WorkbookClient } from "./WorkbookClient";



export class StepInstanceClient extends UnitInstanceClient {
    flowSheet:FlowSheetClient=<any>undefined;
    fromJSON(json:StepInstanceJSON){
        super.fromJSON(json);
        if (json.flowSheet)
            this.flowSheet=FlowSheetClient.fromJSON(json.flowSheet,this.workbook)
    }
    toJSON():StepInstanceJSON{
        let rslt = <StepInstanceJSON>super.toJSON()
        rslt.flowSheet = this.flowSheet.toJSON();
        return rslt;
    }
}