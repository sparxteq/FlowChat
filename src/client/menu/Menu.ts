import { DB } from "../../../../Zing3/share/DB";
import { ClickWrapperUI } from "../../../../Zing3/zui/ClickWrapperUI";
import { DivUI } from "../../../../Zing3/zui/DivUI";
import { ImageUI } from "../../../../Zing3/zui/ImageUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { NameString } from "../../common/NameString";
import { closePopup, showPopup } from "../popupZUI";



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
    addItem(name:string,parameters:MenuParam[],action:MenuAction | Menu,description:string){
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
            let menuItemZUI = this.menuItemZUI(menuItem)
            itemList.push(menuItemZUI)
        }
        return new DivUI(itemList).style("MenuContainer")
    }
    menuItemZUI(menuItem:MenuItem):ZUI{
        let name = NameString.toCapSpaced(menuItem.name)
        let menuText = new TextUI(name).style("MenuItemText");
        let rightArrow = new ImageUI("/icons/RightArrow.png")
            .style("MenuArrow")
        if (menuItem.action instanceof Menu){
            let clicker = new ClickWrapperUI([menuText,rightArrow])
                .click(()=>{
                    //DB.msg("creating submenu ",menuItem.action)
                    let targetId = clicker.uniqueId();
                    let action = <Menu>menuItem.action;
                    let subZUI = action.menuZUI((menuItem:MenuItem)=>{
                        DB.msg("subZUI.selected called",menuItem)
                    })
                    showPopup(subZUI,targetId,()=>{
                        //DB.msg("submenu pop closed")
                    },true,true)
                
                })
                .style("MenuItem")
            return clicker
        }
        let clicker = new ClickWrapperUI([menuText])
            .click(()=>{
                if (typeof menuItem.action == "function"){
                    menuItem.action([]);
                    closePopup();
                }
            })
            .style("MenuItem")
        return clicker;
    }
}

export type MenuItem = {
    name:string
    parameters:MenuParam[]
    action:MenuAction | Menu
    description:string
    
}

export type MenuParam ={
    name:string
    type:string
    description:string
}

export type MenuAction = (parameters:any[])=>void;