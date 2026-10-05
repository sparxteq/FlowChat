import { ZT, ZDict } from "../../../common/ZT";
import { FlowSheetClient } from "../../workbook/FlowSheetClient";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { StandardChartParam, StandardChartView } from "./StandardChartView";




export class MzRtChartView extends StandardChartView{
    paramType():ZT{
        return new ZDict();
    }
    inputTypes(): { [inputId: string]: string; } {
        return {
            table:this.checkType("Features")
        };
    }
    defaultParam():StandardChartParam {
        return {xColumn:"mz",yColumn:"rt",style:"dot",multiChartCol:"decision",
            chartHeightPixels:400
        };
    }
    make(flowSheet:FlowSheetClient):UnitInstanceClient{
        return new MzRtChartView(flowSheet);
    }
}