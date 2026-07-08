import { ZFiles } from "./files/ZFiles"



export abstract class FlowChatContext {
    abstract getFile(filePath:string,makeNew?:boolean):Promise<ZFiles|undefined>
    abstract getFolder(folderPath:string,makeNew?:boolean):Promise<ZFiles|undefined>
    abstract addUser(userEmail:string,firstName:string,lastName:string):
        Promise<{success:boolean}>
    abstract loginUser(userEmail:string):Promise<{success:boolean
        userEmail:string,firstName:string,lastName:string
    }>
}