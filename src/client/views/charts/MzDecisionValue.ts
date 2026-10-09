import { ZT, ZDict } from "../../../common/ZT";
import { FlowSheetClient } from "../../workbook/FlowSheetClient";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { FeaturesChartView } from "./FeaturesChartView";
import { StandardChartDraw, StandardChartParam, StandardChartView } from "./StandardChartView";




export class MzDecisionValue extends FeaturesChartView{
    paramType():ZT{
        return new ZDict();
    }
    inputTypes(): { [inputId: string]: string; } {
        return {
            table:this.checkType("Features")
        };
    }
    defaultParam():StandardChartParam {
        return {xColumn:"mz",yColumn:"decisionValue",style:"matchStick",multiChartCol:"decision",
            chartHeightPixels:150
        };
    }
    subClassAdjust(draw:StandardChartDraw){
        draw.axisDecimals(3,2)
    }
    make(flowSheet:FlowSheetClient):UnitInstanceClient{
        return new MzDecisionValue(flowSheet);
    }
}