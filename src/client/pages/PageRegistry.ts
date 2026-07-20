import { Page, PageState } from "../../../../Zing3/zui/Page";
import { PageManager } from "../../../../Zing3/zui/PageManager";
//import { ActivityPage } from "./ActivityPage";
import { HomePage } from "./HomePage";
import { WorkPage } from "./WorkPage";


export class PageRegistry {
    static register<T extends Page>(name:string,cls: new (state:PageState)=>T){
        PageManager.registerPageFactory(name,(state:PageState)=>{
            return new cls(state);
        })
    }
    static init(){
        this.register("home",HomePage);
        this.register("work",WorkPage)
        //this.register("activity",ActivityPage)
    }
}