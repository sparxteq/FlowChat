import { Files } from "./files/Files"



export abstract class FlowChatContext {
    abstract getFile(filePath:string,makeNew?:boolean):Promise<Files|undefined>
    abstract getFolder(folderPath:string,makeNew?:boolean):Promise<Files|undefined>
    abstract addUser(userEmail:string,firstName:string,lastName:string):
        Promise<{success:boolean}>
    abstract loginUser(userEmail:string):Promise<{success:boolean
        userEmail:string,firstName:string,lastName:string
    }>
}