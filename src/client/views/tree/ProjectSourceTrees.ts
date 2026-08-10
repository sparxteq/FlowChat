import { DB } from "../../../../../Zing3/share/DB";
import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { ZFilesDirectoryItem } from "../../../common/http/httpTypes";
import { http } from "../../http/ClientHTTP";


export class ProjectSourceTrees {
    private static sourceTrees:{[actProjPath:string]:ZFilesDirectoryItem | "loading"}={}
    static getSourceTree(email:string,actPath:string,projId:string,modelLoaded:()=>void):ZFilesDirectoryItem{
        let actProjPath = actPath+"/"+projId;
        let tree = this.sourceTrees[actProjPath]
        if (tree){
            if (typeof tree == "string"){
                return {name:"***loading***",isFolder:false,folderContents:[]}
            } else {
                return tree;
            }
        } else {
            this.sourceTrees[actProjPath]="loading";
            http.projectSourcesTree(email,actPath,projId).then((tree:ZFilesDirectoryItem)=>{
                //DB.start("getSourceTree response")
                this.sourceTrees[actProjPath]=tree;
                modelLoaded();
                //DB.end();
            })
            return {name:"***loading***",isFolder:false,folderContents:[]}
        }
    }
}