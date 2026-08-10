import { DB } from "../../../../../Zing3/share/DB";
import { DivUI } from "../../../../../Zing3/zui/DivUI";
import { OpenCloseUI } from "../../../../../Zing3/zui/OpenCloseUI";
import { StyleCheckUI } from "../../../../../Zing3/zui/StyleCheckUI";
import { TextUI } from "../../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { ViewTreeData } from "./ViewTreeModel";


type ViewSelectionTree = {[name:string]:ViewSelectionTree}
export class ViewEditTree extends ZUI{
    choiceNotify:(path:string,selected:boolean)=>void;
    tree:ViewTreeData;
    selectedPath="";
    selected=false;
    multi:boolean
    constructor(tree:ViewTreeData
            ,choiceNotify:(path:string,selected:boolean)=>void
            ,multi:boolean){
        super()
        //DB.start(`ViewEditTree const ${multi}`)
        this.tree=tree;
        this.choiceNotify=choiceNotify;
        this.selectedPath="";
        this.multi=multi;
        if (this.tree.isFolder()){
            this.content = this.folderUI()
        } else {
            this.content = this.fileUI()
        }
        //DB.end()
    }
    setTree(tree:ViewTreeData,selections:string[]){
        //DB.start("ViewEditTree.setTree")
        //DB.msg("parms",{tree,selections})
        this.tree=tree;
        this.setSelections(selections);
        ZUI.notify()
        //DB.end()
    }
    private setSelections(selections:string[] | string){
        if (typeof selections == "string")
            selections = [selections]
        let selTree=this.buildSelectionTree(selections);
        this.setSelectionsFromTree(selTree);
    }
        private buildSelectionTree(selections:string[]):ViewSelectionTree{
            let tree:ViewSelectionTree={};
            for (let sel of selections){
                let selParts = sel.split("/");
                let cur = tree;
                for (let part of selParts){
                    if (!cur[part])
                        cur[part]={}
                    cur = cur[part]
                }
            }
            return tree;
        }
    collectSelections(path:string):string[]{
        let rslt:string[]=[];
        let newPath = path;
        if (path!="")
            newPath+="/"
        if (this.selected){
            if (this.tree.isFolder()){
                return [newPath+this.tree.name()+"/*"]
            } else {
                return [newPath+this.tree.name()]
            }
        } 
        if (this.contentViews){
            for (let cv of this.contentViews){
                let cvSelections = cv.collectSelections(newPath+this.tree.name())
                rslt = [...rslt,...cvSelections]
            }
        }
        return rslt;
    }
    private openClose?:OpenCloseUI
    private folderUI():ZUI{
        let open=false;
        if (this.openClose && !this.openClose.hidden)
            open=true;
        let checkbox = new StyleCheckUI(
            ()=>this.selected)
            .click(()=>{
                this.selected = !this.selected;
                this.selectContentViews(this.selected)
                this.choiceNotify(this.tree.name(),this.selected)
            }).style("ViewTreeSingle-ocCheck")
        this.openClose = new OpenCloseUI(this.folderHeader()
            ,()=>{
                return this.contentsUI()
            },open).style("col-11")
        if (this.multi)
            return new DivUI([checkbox,this.openClose])
        else
            return new DivUI([this.openClose])
    }
    private folderHeader():ZUI{
        let label = new TextUI(this.tree.name()).style("col-10")
        return label
    }
    private fileUI():ZUI{
        let checkbox = new StyleCheckUI(
            ()=>this.selected)
            .click(()=>{
                this.selected = !this.selected;
                let s = this.selected;
                if (!this.multi && this.selected)
                    this.choiceNotify(this.tree.name(),false)
                this.selected=s;
                this.choiceNotify(this.tree.name(),s)
            })
        let label = new TextUI(this.tree.name()).style("col-10")
        return new DivUI([checkbox,label]).style("col-12")
    }
    private contentViews?:ViewEditTree[];
    selectContentViews(selected:boolean){
        if (this.contentViews){
            for (let cv of this.contentViews){
                cv.selected=selected;
                cv.selectContentViews(selected);
            }
            ZUI.notify();
        }
    }
    private selectionTree:ViewSelectionTree={}
    private setSelectionsFromTree(selTree:ViewSelectionTree){
        //DB.start("ViewEditTree setSelectionsFromTree")
        //DB.msg('tree',this.tree.tree)
        //DB.msg(`selTree`,selTree)
        if (selTree && selTree["_sources"])
            selTree=selTree["_sources"]
        this.selectionTree=selTree;
        if (this.contentViews){
            //DB.msg("has contentViews")
            for (let cv of this.contentViews){
                let name = cv.tree.name()
                //DB.start(name)
                if (selTree && selTree[name]){
                    let subTree = selTree[name];
                    //DB.msg("subTree",subTree)
                    if (Object.keys(subTree).length>0){
                        cv.setSelectionsFromTree(subTree)
                    } else {
                        cv.selected=true
                    }
                }
                //DB.end()
            }
        } else {
            if (selTree && Object.keys(selTree).length==0){
                //DB.msg(`setting ${this.tree.tree.name} to true`)
                this.selected=true;
            }
        }
        //DB.msg("this",this)
        //DB.end()
    }
    private contentsUI():ZUI{
        if (this.contentViews){
            return new DivUI(this.contentViews)
        } else {
            let contents = this.tree.contents();
            this.contentViews=[];
            for (let cont of contents){
                let zui = new ViewEditTree(cont,(path:string,selected:boolean)=>{
                    if (!selected){
                        this.selected=false;
                    }
                    if (path=="")
                        this.choiceNotify(this.tree.name(),selected)
                    else
                        this.choiceNotify(this.tree.name()+"/"+path,selected)
                },this.multi);
                if (this.selectionTree){
                    let name = cont.name()
                    let contSel = this.selectionTree[name]
                    zui.setSelectionsFromTree(contSel)
                }
                this.contentViews.push(zui);
            }
            this.content = this.folderUI();
            this.setSelectionsFromTree(this.selectionTree)
            //this.selectContentViews(this.selected);
            return new DivUI(this.contentViews);
        }
    }
}