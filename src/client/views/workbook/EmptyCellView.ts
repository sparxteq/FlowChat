import { DB } from "../../../../../Zing3/share/DB";
import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { ImageButtonUI } from "../../../../../Zing3/zui/ImageButtonUI";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { Menu, MenuItem } from "../../menu/Menu";
import { showPopup } from "../../popupZUI";
import { FlowSheetClient } from "../../workbook/FlowSheetClient";
import { UnitInstanceClient } from "../../workbook/UnitInstanceClient";
import { SheetCellView } from "./SheetCellView";
import { SheetView } from "./SheetView";



export class EmptyCellView extends SheetCellView{
    private row:number;
    private col:number;
    constructor(row:number,col:number,sheetView:SheetView){
        super(sheetView);
        this.row=row;
        this.col=col;
        this.sheetView=sheetView;
        this.content = new DivUI([
            new TextUI(`[${row},${col}]`).style("EmptyCellText"),
            this.menuButton()
        ]).style("EmptyCellView")
    }
    protected menuButton():ZUI{
        let mb = new ImageButtonUI([{
            name:"menu",
            imageSource:"/icons/MenuButton.png"
        }],"menu").click(()=>{
            //DB.msg("menu clicked")
            let menu = this.menu();
            let menuZUI = menu.menuZUI((menuItem:MenuItem)=>{
                
            })
            showPopup(menuZUI,mb.jq[0].id,()=>{
                //DB.msg("menu closed")
            })
        })
        mb.style("MenuButtonEmpty")
        return mb;
    }
    private _menu?:Menu;
    protected menu():Menu{
        if (this._menu)
            return this._menu;
        
        let menu=new Menu("empty menu","");
        let viewMenu=new Menu("views","")
            this.addViewItems(viewMenu);
            /*viewMenu.addItem("Chart",[],()=>{
                DB.msg(`create a chart at [${this.row},${this.col}]`)
            },"create a chart")
            viewMenu.addItem("Graph",[],()=>{
                DB.msg(`create a graph at [${this.row},${this.col}]`)
            },"create a graph")*/
        menu.addItem("Create_view",[],viewMenu,"select a view to create");

        let stepMenu = new Menu("steps","")
            this.addStepItems(stepMenu);
        menu.addItem("Create_Step",[],stepMenu,"select a step to create")

        let collapseMenu = new Menu("Collapse Empty","")
            this.addCollapseItems(collapseMenu)
        menu.addItem("Collapse Empties",[],collapseMenu,"select which direction to collapse empties")
        this._menu=menu;
        return menu;
    }
    private addViewItems(viewMenu:Menu){
        let list = UnitInstanceClient.viewList();
        let sheetView = this.sheetView;
        let flowSheet = <FlowSheetClient>this.sheetView.flowSheet
        for (let listItem of list){
            viewMenu.addItem(listItem.name,[],()=>{
                let instanceId= flowSheet.addUnitInstance(this.row,this.col,listItem.typeId)
                flowSheet.workbook.dirty();
                sheetView.refreshView();
            },"")
        }
    }
    private addStepItems(stepMenu:Menu){
        let list = UnitInstanceClient.stepList();
        let sheetView = this.sheetView;
        let flowSheet = <FlowSheetClient>this.sheetView.flowSheet
        for (let listItem of list){
            stepMenu.addItem(listItem.name,[],()=>{
                let instanceId= flowSheet.addUnitInstance(this.row,this.col,listItem.typeId)
                flowSheet.workbook.dirty();
                sheetView.refreshView();
            },"")
        }
    }
    private addCollapseItems(collapseMenu:Menu){
        collapseMenu.addItem("Up",[],()=>{
            let sheetView = this.sheetView;
            let flow = sheetView.flowSheet!
            let topInstId = flow.nextInstanceBelow(this.row,this.col);
            let topInst = flow.workbook.getUnitInstance(topInstId)
            if (!topInst)
                return;
            let {row,col} = topInst.getCell()
            let newTop = this.row;
            let newLeft = this.col;
            flow.moveRegionInstances(col,row,col,flow.nRows(),newLeft,newTop)
            sheetView.refreshView();
            //DB.msg("collapse empty up")
        },"Collapse all empties immediately below this one including this one")
        collapseMenu.addItem("toLeft",[],()=>{
            let sheetView = this.sheetView;
            let flow = sheetView.flowSheet!
            let leftInstId = flow.nextInstanceToRight(this.row,this.col);
            let leftInst = flow.workbook.getUnitInstance(leftInstId)
            if (!leftInst)
                return;
            let {row,col} = leftInst.getCell()
            let newTop = this.row;
            let newLeft = this.col;
            flow.moveRegionInstances(col,row,flow.nCols(),row,newLeft,newTop)
            sheetView.refreshView();
            //DB.msg("collapse left")
        },"Collapse all empties to the right including this one")
    }
}