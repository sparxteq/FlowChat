import { DivUI } from "../../../../Zing3/zui/DivUI";
import { ImageUI } from "../../../../Zing3/zui/ImageUI";
import { Page, PageState } from "../../../../Zing3/zui/Page";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { versionName } from "../../version";
import { ActivityView } from "../views/ActivityView";
import { InstanceView } from "../views/workbook/InstanceView";
import { LoadContext } from "../views/LoadContext";
import { ProjectView } from "../views/ProjectView";
import { WorkbookView } from "../views/WorkbookView";


export class WorkPage extends Page implements LoadContext{
    pageName(): string {
        return "work";
    }
    curProj = "-";
    curWb = "-";
    constructor(pageState:PageState){
        super(pageState);
        this.content=new TextUI("Work page")
        this.setup().then(()=>{
            ZUI.notify();
        })
    }
    private activityView = new ActivityView(this)
    private projectView = new ProjectView(this)
    private workbookView = new WorkbookView(this)
    private instanceView = new InstanceView(this);
    reloadViews(): void {
        this.activityView.load();
        this.projectView.load();
        this.workbookView.load();
        this.instanceView.load();
    }
    private async setup():Promise<void>{
        let homeHeaderZuis: ZUI[]=[
                new ImageUI("/icons/Magellan.png").css("width:50px;height:50px").style("col-2"),
                new TextUI("Magellan-Compass").style("HomeHeaderText"),
                new TextUI(`v. ${versionName}`).style("HomeHeaderVersion"),
        ]
        let header = new DivUI(homeHeaderZuis).style("HomeHeader");
        this.content = new DivUI([
            header,
            this.activityView,
            this.projectView,
            this.workbookView,
            this.instanceView 
        ])
    }
}