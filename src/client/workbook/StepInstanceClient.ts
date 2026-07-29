import { StepInstanceJSON } from "../../common/WorkbookJSON";
import { FlowTableClient } from "./FlowTableClient";
import { UnitInstanceClient } from "./UnitInstanceClient";
import { WorkbookClient } from "./WorkbookClient";



export class StepInstanceClient extends UnitInstanceClient {
    flowTable:FlowTableClient=<any>undefined;
    fromJSON(json:StepInstanceJSON){
        super.fromJSON(json);
        if (json.flowTable)
            this.flowTable=FlowTableClient.fromJSON(json.flowTable,this.workbook)
    }
    toJSON():StepInstanceJSON{
        let rslt = <StepInstanceJSON>super.toJSON()
        rslt.flowTable = this.flowTable.toJSON();
        return rslt;
    }
}