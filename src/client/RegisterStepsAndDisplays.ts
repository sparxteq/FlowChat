import { DB } from "../../../Zing3/share/DB";
import { DecisionValue } from "./views/charts/DecisionValue";
import { MzDecisionValue } from "./views/charts/MzDecisionValue";
import { MzRtChartView } from "./views/charts/MzRtChartView";
import { RtDecisionValue } from "./views/charts/RtDecisionValue";
import { StandardChartView } from "./views/charts/StandardChartView";
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
    DisplayInstanceClient.register(new StandardChartView())
    DisplayInstanceClient.register(new MzRtChartView())
    DisplayInstanceClient.register(new RtDecisionValue())
    DisplayInstanceClient.register(new MzDecisionValue())
    DisplayInstanceClient.register(new DecisionValue())
}