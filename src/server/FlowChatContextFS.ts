


import { DB } from "../../../Zing3/share/DB";
import { Files } from "../common/files/Files";
import { FlowChatContext } from "../common/FlowChatContext";
import { FilesFS } from "./files/FilesFS";




export class FlowChatContextFS extends FlowChatContext{
    addUser(userEmail: string, firstName: string, lastName: string): Promise<{ success: boolean; }> {
        throw new Error("Method not implemented.");
    }
    loginUser(userEmail: string): Promise<{ success: boolean; userEmail: string; firstName: string; lastName: string; }> {
        throw new Error("Method not implemented.");
    }
    
    constructor(rootPath?:string){
        super();
        if (!rootPath)
            rootPath = process.env.FILE_SYS_STORAGE
        if (rootPath)
            FilesFS.setRootPath(rootPath)
    }
    async getFile(filePath: string, makeNew=false): Promise<Files | undefined> {
        let r = new FilesFS(filePath)
        if (await r.isFile()){
            //DB.msg("is a file")
            return r;
        }
        if (makeNew){
            //DB.msg("makeNew")
            let err = await r.makeFile(makeNew);
            if (!err || err=="")
                return r;
            return undefined
        }
        return undefined;
    }
   async getFolder(folderPath: string, makeNew=false): Promise<Files | undefined> {
        let r = new FilesFS(folderPath)
        if (await r.isFolder())
            return r;
        if (makeNew){
            let err = await r.makeFolder(makeNew);
            if (!err || err=="")
                return r;
            return undefined;
        }
        return undefined;
    }
}