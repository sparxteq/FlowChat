import { DB } from "../../../Zing3/share/DB";
import { JSONView } from "./views/JSONView";
import { TableView } from "./views/TableView";
import { DisplayInstanceClient } from "./workbook/DisplayInstanceClient";
import { StepInstanceClient } from "./workbook/StepInstanceClient";
import { UnitClient } from "./workbook/UnitClient";





export async function registerStepsAndDisplays():Promise<void>{
    await UnitClient.loadUnits();
    for (let unitId of UnitClient.unitIds()){
        StepInstanceClient.register(new StepInstanceClient(unitId,<any>undefined))
    }
    DisplayInstanceClient.register(new TableView())
    DisplayInstanceClient.register(new JSONView())
}