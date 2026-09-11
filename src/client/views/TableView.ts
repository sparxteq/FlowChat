import { DB } from "../../../../Zing3/share/DB";
import { DivUI } from "../../../../Zing3/zui/DivUI";
import { PageManager } from "../../../../Zing3/zui/PageManager";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { TableMem } from "../../common/TableMem";
import { TypeName } from "../../common/WorkbookJSON";
import { ZT, ZDict } from "../../common/ZT";
import { DisplayInstanceClient } from "../workbook/DisplayInstanceClient";
import { FlowSheetClient } from "../workbook/FlowSheetClient";
import { UnitInstanceClient } from "../workbook/UnitInstanceClient";
import { InteractiveViewTable } from "./InteractiveViewTable";
import { TableDownload } from "./TableDownload"



export class TableView extends DisplayInstanceClient{

    description(): string {
        return `Displays a standard row / column view of a table`
    }
    paramType(): ZT {
        return new ZDict();
    }
    defaultParam():any{
        return {}
    }
    inputTypes(): { [inputId: string]: string; } {
        return {
            table:this.checkType("CSV")
        };
    }
    
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [];
    }
    
    make(flowSheet:FlowSheetClient): UnitInstanceClient {
        return new TableView(flowSheet);
    }
    private table:TableMem = <any>undefined;
    async computeDisplay():Promise<ZUI>{
        let variable = await this.getVarCSV("table");
        let name = this.constructor.name;
        if (variable instanceof TableMem){
            this.table=variable;
            return new DivUI([
                new TableViewContent(this.table).style("col-12"),
                new TableDownload(this.table,name).style("col-12")
            ]) 
        }
        return new TextUI(`display ${name} error ${variable}`).style("col-12")
    }
}

class TableViewContent extends ZUI{
    viewTable:InteractiveViewTable;
    
    private colSortOff=false;
    private colSelectionOff=false;
    private rowSelectionOff=false;
    private thisId=""
    constructor(viewTable:TableMem){
        super();
        if (this.thisId=="")
            this.thisId="TV"+Math.floor(Math.random()*1000000);
        //DB.msg("constructor id",this.thisId)
        this.viewTable=new InteractiveViewTable(viewTable);
        let here = this;
        PageManager.addAfterDOMNotice(()=>{
            let id = here.thisId;
            //DB.msg("after DOM id",id);
            const div = document.getElementById(id!)!;
            if (!div) return;
            let resizeTimer: ReturnType<typeof setTimeout>;

            const observer = new ResizeObserver(entries => {
                clearTimeout(resizeTimer);

                const newHeight = entries[0].contentRect.height;

                resizeTimer = setTimeout(() => {
                    let oldHeight=Number.parseInt(div.style.height);
                    //DB.msg(`old ${oldHeight} new ${newHeight}`)
                    if (Math.abs(oldHeight-newHeight)>5)
                        div.style.height = `${newHeight}px`;
                }, 300);
            })
            observer.observe(div);
        });

    }
    private headerClass:string = "TSTableHeader";
    headerStyle(style:string):TableViewContent{
        this.headerClass= "TSTableHeader "+style;
        return this;
    }
    private cellClass="TSTableCell";
    cellStyle(style:string):TableViewContent{
        this.cellClass="TSTableCell "+style;
        return this;
    }
    
    private table():InteractiveViewTable{
        if (!this.viewTable){
            DB.msg("StandardTableView has no selection manager")
        }
        let table = this.viewTable;
        return table;
    }
    renderJQ():JQuery{
            
        //DB.msg("renderJQ id",this.thisId)
        if(this.viewTable.isEmpty())
            return $(`<div><b>This table is empty or missing</b></div>`)
        this.jq = $(`<table id="${this.thisId}"></table>`);
        this.refresh();
        return this.jq;
    }
    refresh(){
        if (!this.jq){
            this.renderJQ()
            return;
        }
        this.jq.removeClass();
        this.jq.empty();
        if (this.table()){
            this.jq.append(this.columnHeaders());
            this.jq.append(this.body());
        }
        this.jq.addClass(`TSTableUI ${this.classStr()}`)
        this.applyCSS(this.jq);
    }
    
    private columnHeaders():JQuery{
        let headerJQ = $(`<thead class="${this.headerClass}"></thead>`)
        let headerRow = $(`<tr class="${this.headerClass}"></tr>`)
        headerJQ.append(headerRow);
        let columnNames = this.table().colNames();
        if (!this.colSortOff){
            let sortHeader = $(`<th></th>`)
            headerRow.append(sortHeader)
        }
        if (!this.rowSelectionOff){
            let headerCol = $(`<th class="TableRow-unselected">-</th>`)
            headerRow.append(headerCol);
        }
        let colHighlightsB = this.table().highlightColsB();
        for (let cName of columnNames){
            let name = $(`<div class="TSColumnName">${cName}</div>`)
            name.click((event)=>{
                    event.stopPropagation()
                    this.doColClick(cName);
            })
            let th = $(`<th></th>`);
            th.append(name);
            th.append(this.arrowBox(cName))
            if (!this.colSelectionOff)
                th.append(this.colSelect(cName,colHighlightsB))
            headerRow.append(th);
            
        }
        return headerJQ;
    }
        private colSelect(cName:string,colHighlightsB:number[]):JQuery{let colB = this.viewTable.columnIdx(cName);
            let selectClass = "TableCol-selected";
            if (colHighlightsB.indexOf(colB)<0){
                selectClass = "TableCol-unselected"
            }
            let select = $(`<div class="${selectClass}"></div>`)
            select.click((event)=>{
                event.stopPropagation()
                let colB = this.viewTable.columnIdx(cName);
                this.viewTable.addHighlightColB(colB)
            })
            return select;
        }
    
    private doColClick(cName:string){
        let data = this.viewTable;
        let rowSort = data.getRowSort()
        if (!rowSort)
            rowSort = {columnName:cName,descending:false};
        else if (rowSort.columnName == cName){
            rowSort.descending = !rowSort.descending;
        } else {
            rowSort.columnName=cName;
            rowSort.descending=false;
        }
        data.setRowSort(rowSort.columnName,rowSort.descending)
        this.refresh();
    }
    
    private arrowBox(column:string):JQuery{
        let box = $(`<div  class='arrowbox'></div>`);
        let rowSort = this.viewTable.getRowSort()
        if (!rowSort || rowSort.columnName!=column){
            box.addClass("hidden")
        } else if (!rowSort.descending){
            box.addClass("downArrowBtn")
        } else {
            box.addClass("upArrowBtn")
        }
        return box;
    }
    private colIdxSelections:{colIdx:number,value:string | number}[]=[]
    private body():JQuery{
        this.colIdxSelections=[];
        /*for (let colSel of this.selections){
            let colId = colSel.columnId;
            let colIdx = this.viewTable.colNtoV(colId);
            this.colIdxSelections.push({colIdx:colIdx,value:colSel.selectVal})
        }*/
        let nr = this.viewTable.nRows();
        let bodyJQ = $(`<tbody></tbody`)
        for (let rowV=0;rowV<nr;rowV++){
            if (this.rowIsSelected(rowV)){
                let rowJQ = this.row(rowV);
                bodyJQ.append(rowJQ)
            }
        }
        return bodyJQ;
    }
    private rowIsSelected(rowV:number):boolean{
        let row = this.viewTable.getRowV(rowV);
        for (let sel of this.colIdxSelections){
            let v = row[sel.colIdx];
            if (v!=sel.value)
                return false;
        }
        return true;
    }
    
    private row(rowV:number):JQuery{
        let rowJQ=$("<tr></tr>");
        let table = this.viewTable;
        let nc = table.nCols();
        if (!this.colSortOff){
            let selectBox = this.colSortBox(rowV);
            rowJQ.append(selectBox)
        }
        let selectClass="TableRow-unselected"
        let rowsV = table.highlightRowsV();
        if (rowsV.indexOf(rowV)>=0)
            selectClass="TableRow-selected"
        if (!this.rowSelectionOff){
            let selectBar = $(`<td class="${selectClass}"></td>`)
            selectBar.click((event)=>{
                event.stopPropagation()
                this.doRowSelect(rowV)
        })
        rowJQ.append(selectBar)
        }
        for (let col=0;col<nc;col++){
            let v = table.getCell(rowV,col);
            if (!Number.isNaN(v))
                v = v.toLocaleString();
            let cellJQ = $(`<td  class="${this.cellClass}">${v}</td>`);
            rowJQ.append(cellJQ);
        }
        return rowJQ;
    }
        private colSortBox(rowV:number):JQuery{
            let rowB = this.viewTable.rowVtoB(rowV);
            let sortClass = "TableColSort-unselected"
            let colSort = this.viewTable.getColSort()
            if (colSort.rowIdxB==rowB){
                if (colSort.descending)
                    sortClass = "rightArrowBtn"
                else
                    sortClass = "leftArrowBtn"
            }
            let box = $(`<td class='${sortClass}'></td>`)
            box.click((event)=>{
                //DB.msg(`boxClick V${rowV} B${rowB}`)
                event.stopPropagation();
                if (colSort.rowIdxB!=rowB)
                    colSort={rowIdxB:rowB,descending:true}
                else {
                    colSort.descending=!colSort.descending;
                }
                this.viewTable.setColSort(colSort.rowIdxB,colSort.descending)
                this.refresh();
            })
            return box;
        }
        private doRowSelect(rowV:number){
            this.viewTable.addHighlightRowV(rowV)
            ZUI.notify();
        }
}