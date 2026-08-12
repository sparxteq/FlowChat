import { DB } from "../../../../Zing3/share/DB";
import { ClickWrapperUI } from "../../../../Zing3/zui/ClickWrapperUI";
import { DivUI } from "../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { NameString } from "../../common/NameString";
import { closePopup } from "../popupZUI";



export class Menu{
    protected menuItems:MenuItem[]=[]
    title:string
    description:string
    constructor(title:string,description:string){
        this.title=title;
        this.description=description
    }
    clear(){
        this.menuItems = []
    }
    addItemI(item:MenuItem){
        this.menuItems.push(item)
    }
    addItem(name:string,parameters:MenuParam[],action:MenuAction,description:string){
        let mi:MenuItem = {
            name:name,
            parameters:parameters,
            action:action,
            description:description
        }
        this.addItemI(mi);
    }

    menuZUI(selected:(menuItem:MenuItem)=>void):ZUI{
        let itemList:ZUI[]=[];
        for (let menuItem of this.menuItems){
            itemList.push(this.menuItemZUI(menuItem,()=>{
                DB.msg("menu selected ",menuItem)
                selected(menuItem);
            }))
        }
        return new DivUI(itemList).style("MenuContainer")
    }
    menuItemZUI(menuItem:MenuItem,selected:()=>void):ZUI{
        let name = NameString.toCapSpaced(menuItem.name)
        let menuText = new TextUI(name).style("MenuItemText");
        let clicker = new ClickWrapperUI([menuText])
            .click(()=>{
                selected();
                closePopup();
            })
            .style("MenuItem")
        return clicker;
    }
}

export type MenuItem = {
    name:string
    parameters:MenuParam[]
    action:MenuAction
    description:string
    
}

export type MenuParam ={
    name:string
    type:string
    description:string
}

export type MenuAction = (target:any,parameters:any[])=>void;