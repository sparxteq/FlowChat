import { ZFilesDirectoryItem } from "../../../common/http/httpTypes";


export abstract class ViewTreeNode{
    extensions:string[]
    constructor(extensions:string[]=[]){
        this.extensions=extensions
        for (let extI in this.extensions){
            this.extensions[extI]=this.extensions[extI].toLocaleLowerCase();
        }
    }
    abstract isFolder():boolean;
    abstract name():string ;
    abstract contents():ViewTreeData[];
    static extension(name:string):string{
        let extI = name.lastIndexOf(".");
        let ext = "";
        if (extI>0){
            ext = name.substring(extI+1);
        }
        return ext;
    }
}
export class ViewTreeData extends ViewTreeNode{
    tree:ZFilesDirectoryItem;
    constructor(tree:ZFilesDirectoryItem){
        super();
        this.tree=tree;
    }
    isFolder(): boolean {
        return this.tree.isFolder;
    }
    name(): string  {
        return this.tree.name;
    }
    contents(): ViewTreeData[] {
        let cont:ViewTreeData[]=[];
        for (let name in this.tree.folderContents){
            let ext = ViewTreeNode.extension(name)
            let vtn = new ViewTreeData(this.tree.folderContents[name])
            if (this.extensions.length==0 || (ext!="" && this.extensions.indexOf(ext)>=0))
                cont.push(vtn);
        }
        return cont;
    }
}