import {PageState} from "../../../Zing3/zui/Page"
import { ImpPageManager } from "../../../Zing3/zui/ImpPageManager"
import { ZUI } from "../../../Zing3/zui/ZUI"
import { HomePage } from "./pages/HomePage"
import { PageRegistry } from "./pages/PageRegistry"
import { registerViews } from "./views/varViews/RegisterViews"

let homePageState:PageState = {}
PageRegistry.init();
registerViews()
let homePage = new HomePage(homePageState);
ZUI.pageManager = new ImpPageManager(homePage,"#content")