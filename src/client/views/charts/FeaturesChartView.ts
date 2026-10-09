import { ButtonUI } from "../../../../../Zing3/zui/ButtonUI";
import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { OpenCloseUI } from "../../../../../Zing3/zui/OpenCloseUI";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { FlowSheetClient } from "../../workbook/FlowSheetClient";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { InteractiveViewTable } from "../InteractiveViewTable";
import { TableDownload } from "../TableDownload";
import { RangeRibbonUI } from "./RangeRibbonUI";
import { StandardChartDraw, StandardChartParam, StandardChartView } from "./StandardChartView";




export class FeaturesChartView extends StandardChartView{
    
    inputTypes(): { [inputId: string]: string; } {
        return {
            table:this.checkType("Features")
        };
    }
    make (flowSheet:FlowSheetClient):UnitInstanceClient{
        return new FeaturesChartView(flowSheet);
    }
    async computeDisplay():Promise<ZUI>{
        let param = <StandardChartParam>this.paramValue
        let variable = await this.getVarInteractive("table")
        if (typeof variable == "string"){
            return new TextUI(`table error on table in ${this.name()}`)
        }
        let name = this.name();
        if (variable instanceof InteractiveViewTable){
            this.table = variable;
            let decisionIdx = this.table.colNtoV("decision")
            let srcIdIdx = this.table.colNtoV("srcId")
            let subCharts = await this.findSubCharts(decisionIdx,srcIdIdx)
            let chartList:ZUI[]=[]
            let first=true;
            for (let sb of subCharts){
                let c = new OpenCloseUI(new TextUI(sb),()=>{
                    return this.chartContent(this.table,param,sb)
                },first)
                chartList.push(c)
                first=false;
            }

            return new DivUI([
                ...chartList,
                new TableDownload(this.table.baseTable,name).style("col-12")
            ])
        }
        return new TextUI(`display ${name} error ${variable}`).style("col-12")
    }
    async findSubCharts(decisionIdx:number,srcIdIdx:number):Promise<string[]>{
        let chartTable:{[chartName:string]:boolean}={}
        let nr = this.table.nRows();
        for (let rowI=0;rowI<nr;rowI++){
            let decision = this.table.getCell(rowI,decisionIdx);
            let srcId = this.table.getCell(rowI,srcIdIdx)
            let chartName = decision+" - "+srcId
            chartTable[chartName]=true;
        }
        let rslt=Object.keys(chartTable);
        rslt.sort();
        return rslt;
    }
    protected chartContent (iTable:InteractiveViewTable,param:StandardChartParam,chartName:string):ZUI{
        let chartDraw = new FeaturesChartDraw(iTable,param,this,chartName)
        let ribbonRight = new RangeRibbonUI(iTable,param.yColumn,"v",param.chartHeightPixels)
        ribbonRight.style("XYChartRight")
        let ribbonBelow = new RangeRibbonUI(iTable,param.xColumn,"h")
        ribbonBelow.style("XYChartBelow")
        let resetButton = new ButtonUI("x").click(()=>{
            iTable.clearRanges();
            ZUI.notify();
        })
        resetButton.style("XYChartReset")
        return new DivUI([
            chartDraw,
            ribbonRight,
            ribbonBelow,
            resetButton
        ])
    }

}
export class FeaturesChartDraw extends StandardChartDraw{
    decisionIdx:number;
    srcIdIdx:number;
    decision:string;
    srcId:string;
    constructor(viewTable:InteractiveViewTable,param:StandardChartParam
            ,parent:StandardChartView,chartName:string){
        super(viewTable,param,parent)
        let parts = chartName.split(" - ");
        this.decision = parts[0];
        this.srcId = parts[1]
        this.decisionIdx = viewTable.colNtoV("decision");
        this.srcIdIdx = viewTable.colNtoV("srcId")
    }
    protected validRow(data:InteractiveViewTable,rowI:number):boolean{
        let rowDecision=data.getCell(rowI,this.decisionIdx)
        let rowSrcId = data.getCell(rowI,this.srcIdIdx);
        return rowDecision==this.decision && rowSrcId==this.srcId;
    }
}