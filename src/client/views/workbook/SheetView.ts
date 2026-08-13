import { DB } from "../../../../../Zing3/share/DB";
import { BreakUI } from "../../../../../Zing3/zui/BreakUI";
import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { Modal } from "../../../../../Zing3/zui/Modal";
import { TableUI } from "../../../../../Zing3/zui/TableUI"
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { http } from "../../http/ClientHTTP";
import { registerStepsAndDisplays } from "../../RegisterStepsAndDisplays";
import { FlowSheetClient } from "../../workbook/FlowSheetClient";
import { UnitClient } from "../../workbook/UnitClient";
import { WorkbookClient } from "../../workbook/WorkbookClient";
import { ActivityView } from "../ActivityView";
import { LoadContext } from "../LoadContext";
import { ProjectView } from "../ProjectView";
import { WorkbookView } from "../WorkbookView";
import { EmptyCellView } from "./EmptyCellView";



export class SheetView extends ZUI{
    private context:LoadContext
    private workbook:WorkbookClient=<any>undefined;
    constructor(context:LoadContext){
        super();
        this.context=context; 
        this.content = new BreakUI();
        if (ActivityView.curActivity=="-")
            return;
        if (ProjectView.curProj=="-")
            return;
        if (WorkbookView.curWorkbook=="-")
            return;
        this.load().then(()=>{
            ZUI.notify()
        })
        let ins = new DivUI([
            new TextUI("sheet").style("col-12")
        ]).style("col-12")
        this.content=ins;
    }
    async load(){
        if (ActivityView.curActivity=="-")
            return;
        if (ProjectView.curProj=="-")
            return;
        if (WorkbookView.curWorkbook=="-")
            return;
        await registerStepsAndDisplays()
        
        this.workbook = new WorkbookClient(http.curUser!.email,ActivityView.curActivity
                ,ProjectView.curProj,WorkbookView.curWorkbook)

        let success = await this.workbook.load()
        if (!success)
            Modal.alert(`workbook ${WorkbookView.curWorkbook} did not load`)
        else {
            this.content = this.buildView();
            ZUI.notify();
        }

    }
    refreshView(){
        this.content = this.buildView();
        ZUI.notify();
    }
    flowSheet?:FlowSheetClient;
    private buildView():ZUI{
        let table = new TableUI().style("SheetView")
        let flowSheet = <FlowSheetClient>this.workbook.flowSheet;
        this.flowSheet=flowSheet;
        let instanceIds=Object.keys(flowSheet.unitInstances);
        let nr = flowSheet.nRows();
        let nc = flowSheet.nCols();
        for (let r=0;r<nr;r++){
            for (let c=0;c<nc;c++){
                let emptyCell = new EmptyCellView(r,c,this)
                table.cell(r,c,emptyCell)
            }
        }
        for (let instId of instanceIds){
            let unitInst = this.workbook.getUnitInstance(instId);
            let {row, col}=unitInst.getCell()

            let unitCell = unitInst.cellView(this);
            table.cell(row,col,unitCell)
        }
        return table;
    }
}