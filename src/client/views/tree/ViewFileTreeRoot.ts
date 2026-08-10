
import { DB } from "../../../../../Zing3/share/DB";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { ProjectSourceTrees } from "./ProjectSourceTrees";
import { ViewEditTree } from "./ViewEditTree";
import { ViewTreeData, ViewTreeNode } from "./ViewTreeModel";



export class ViewFileTreeRoot extends ZUI {
    treeView:ViewEditTree;
    constructor(email:string,actPath:string,projId:string,selections:string[]
        ,choiceNotify:(path:string,selected:boolean)=>void
        ,modelLoaded:()=>void
        ,multi:boolean
    ){
        super();
        //DB.start("ViewFileTreeRoot const")
        let tree = ProjectSourceTrees.getSourceTree(email,actPath,projId,modelLoaded);
        let model = new ViewTreeData(tree);
        this.treeView = new ViewEditTree(model,choiceNotify,multi);
        this.treeView.setTree(model,selections)
        this.content = this.treeView;
        //DB.end()
    }
    setTree(tree:ViewTreeData,selections:string[]){
        this.treeView.setTree(tree,selections)
    }
    selectContentViews(selected:boolean){
        this.treeView.selectContentViews(selected)
    }
    collectSelections(path:string):any{
        return this.treeView.collectSelections(path);
    }
}