import { DB } from "../../../../Zing3/share/DB";
import { Page, PageState } from "../../../../Zing3/zui/Page";
import { TextUI} from "../../../../Zing3/zui/TextUI"
import { ImageUI} from "../../../../Zing3/zui/ImageUI"
import { DivUI} from "../../../../Zing3/zui/DivUI"
import { ZUI } from "../../../../Zing3/zui/ZUI";
import {versionName} from "../../version"
import { PageManager } from "../../../../Zing3/zui/PageManager";
//import { ClientHTTP, http } from "../http/ClientHTTP";
//import { LoginView } from "../views/LoginView";
import { ImpPageManager } from "../../../../Zing3/zui/ImpPageManager";
import { LoginView } from "../views/LoginView";


export class HomePage extends Page{
    pageName(): string {
        return "home";
    }
    constructor(pageState:PageState){
        super(pageState);
        this.content = new TextUI("Home page")
        this.setup().then(()=>{
            ZUI.notify();
        })
    }
    private async setup():Promise<void>{
        let homeHeaderZuis: ZUI[]=[
                new ImageUI("/icons/Magellan.png").css("width:50px;height:50px").style("col-2"),
                new TextUI("Magellan-Compass").style("HomeHeaderText"),
                new TextUI(`v. ${versionName}`).style("HomeHeaderVersion"),
        ]
        let header = new DivUI(homeHeaderZuis).style("HomeHeader");
        this.content=new DivUI([
            header,
            new LoginView()
        ]);
    }
    /*private async setup():Promise<void>{
        let search = window.location.search;
        DB.msg(`search "${search}"`)
        let seed="";
        if (search){
            let parts = search.split("-")
            seed = parts[1]
        }
        let homeHeaderZuis: ZUI[]=[
                new ImageUI("/icons/Magellan.png").css("width:50px;height:50px").style("col-2"),
                new TextUI("Magellan-Compass").style("HomeHeaderText"),
                new TextUI(`v. ${versionName}`).style("HomeHeaderVersion"),
        ]
        let loggedInUser = await http.loggedInUser();
        if (loggedInUser.email && loggedInUser.email!=""){
            /*homeHeaderZuis.push(new TextUI(`${loggedInUser.email}:${loggedInUser.firstName} ${loggedInUser.lastName}`))
            let header = new DivUI(homeHeaderZuis).style("HomeHeader")
            this.content=new DivUI([
                header,
                new ActivityView()
            ]);
            ImpPageManager.GOTO("activity",{});
        } else {
            let header = new DivUI(homeHeaderZuis).style("HomeHeader");
            this.content=new DivUI([
                header,
                new LoginView()
            ]);
        }
    }*/
}
PageManager.registerPageFactory("home",(state:PageState)=>{
    return new HomePage(state);
})