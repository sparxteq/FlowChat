import { ZT, ZDict } from "../../../common/ZT";
import { FlowSheetClient } from "../../workbook/FlowSheetClient";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { StandardChartDraw, StandardChartParam, StandardChartView } from "./StandardChartView";




export class DecisionValue extends StandardChartView{
    paramType():ZT{
        return new ZDict();
    }
    inputTypes(): { [inputId: string]: string; } {
        return {
            table:this.checkType("Features")
        };
    }
    defaultParam():StandardChartParam {
        return {xColumn:"*",yColumn:"decisionValue",style:"dot",multiChartCol:"decision",
            chartHeightPixels:150
        };
    }
    subClassAdjust(draw:StandardChartDraw){
        draw.axisDecimals(3,2)
        draw.clearStyles()
        draw.dataStyle("decisionValue","black",2,"dot")
    }
    adjustViewSort(draw: StandardChartDraw): void {
        draw.viewTable.setRowSort("decisionValue",false)
    }
    make(flowSheet:FlowSheetClient):UnitInstanceClient{
        return new DecisionValue(flowSheet);
    }
}