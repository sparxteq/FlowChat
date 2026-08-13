import { DB } from "../../../../../Zing3/share/DB";
import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { ImageButtonUI } from "../../../../../Zing3/zui/ImageButtonUI";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { Menu, MenuItem } from "../../menu/Menu";
import { showPopup } from "../../popupZUI";
import { SheetCellView } from "./SheetCellView";



export class EmptyCellView extends SheetCellView{
    private row:number;
    private col:number;
    constructor(row:number,col:number){
        super();
        this.row=row;
        this.col=col;
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
            viewMenu.addItem("Chart",[],()=>{
                DB.msg(`create a chart at [${this.row},${this.col}]`)
            },"create a chart")
            viewMenu.addItem("Graph",[],()=>{
                DB.msg(`create a graph at [${this.row},${this.col}]`)
            },"create a graph")
        menu.addItem("Create_view",[],viewMenu,"select a view to create");

        let stepMenu = new Menu("steps","")
            stepMenu.addItem("Do",[],()=>{
                DB.msg(`add a do step at [${this.row},${this.col}]`)
            },"do it")
            stepMenu.addItem("Do not",[],()=>{
                DB.msg(`add a do not step at [${this.row},${this.col}]`)
            },"do not do it")
        menu.addItem("Create_Step",[],stepMenu,"select a step to create")
        return menu;
    }
}