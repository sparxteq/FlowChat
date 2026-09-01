import {PageState} from "../../../Zing3/zui/Page"
import { ImpPageManager } from "../../../Zing3/zui/ImpPageManager"
import { ZUI } from "../../../Zing3/zui/ZUI"
import { HomePage } from "./pages/HomePage"
import { PageRegistry } from "./pages/PageRegistry"
import { registerStepsAndDisplays } from "./RegisterStepsAndDisplays"
import { TypeClient } from "./workbook/TypeClient"

TypeClient.loadTypes().then(()=>{

    registerStepsAndDisplays()
    let homePageState:PageState = {}
    PageRegistry.init();
    let homePage = new HomePage(homePageState);
    ZUI.pageManager = new ImpPageManager(homePage,"#content")
})