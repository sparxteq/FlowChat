import { ZT, ZDict } from "../../../common/ZT";
import { FlowSheetClient } from "../../workbook/FlowSheetClient";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { FeaturesChartView } from "./FeaturesChartView";
import { StandardChartDraw, StandardChartParam, StandardChartView } from "./StandardChartView";




export class RtDecisionValue extends FeaturesChartView{
    paramType():ZT{
        return new ZDict();
    }
    inputTypes(): { [inputId: string]: string; } {
        return {
            table:this.checkType("Features")
        };
    }
    defaultParam():StandardChartParam {
        return {xColumn:"rt",yColumn:"decisionValue",style:"matchStick",multiChartCol:"decision",
            chartHeightPixels:150
        };
    }
    subClassAdjust(draw:StandardChartDraw){
        draw.axisDecimals(0,2)
    }
    make(flowSheet:FlowSheetClient):UnitInstanceClient{
        return new RtDecisionValue(flowSheet);
    }
}