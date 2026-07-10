import { DB } from "../../../../Zing3/share/DB";
import { Files, FilesSource } from "../../common/files/Files";
import fs from "fs";
import fsPath from "path"
import fsPromises from "fs/promises"


export class FilesFS extends Files {
    private fd:number=-1;
    private buffer: string="";
    private chunkSize: number=100000;
    private nextCharIdx: number=0;
    private readStartIdx: number=0;
    private binaryIndex: number=0;
    private resetState(): void {
        this.buffer = ""
        this.nextCharIdx = 0;
        this.readStartIdx = 0;
        this.binaryIndex = 0;
    }
    async isFile(): Promise<boolean> {
        let full = this.fullPath();
        try{
            let stats = fs.lstatSync(full);
            let isFile =  stats.isFile();
            if (!isFile)
                DB.msg(`"${full}" is not a file`)
            return isFile;
        } catch {
            return false;
        }
    }
    async isFolder(): Promise<boolean> {
        let full = this.fullPath();
        try {
            let stats = fs.lstatSync(full)
            return stats.isDirectory();
        } catch {
            return false;
        }
    }
    async fileNames(): Promise<string[]> {
         try {
            let names: string[] = [];
            let fullPath = this.fullPath();
            if (fullPath.lastIndexOf("/")!=fullPath.length-1)
                fullPath+="/"
            let dirNames: string[] = fs.readdirSync(fullPath);
            for (let name of dirNames) {
                let full = fullPath+name;
                let stats = fs.lstatSync(full)
                if (stats.isFile())
                    names.push(name)
            }
            return names;
        } catch {
            return [];
        }
    }
    async folderNames(): Promise<string[]> {
         try {
            let names: string[] = [];
            let fullPath = this.fullPath()
            if (fullPath.lastIndexOf("/")!=fullPath.length-1)
                fullPath+="/"
            let dirNames: string[] = fs.readdirSync(fullPath);
            for (let name of dirNames) {
                let full = fullPath+name;
                let stats = fs.lstatSync(full)
                if (stats.isDirectory())
                    names.push(name)
            }
            return names;
        } catch {
            return [];
        }
    }
    private mode:"r"|"w"|"c"="c";
    async openR(): Promise<string | null> {
        if (this.mode != "c"){
            return "openR not closed"
        }
        if (await this.isFile()){
            let full = this.fullPath();
            this.fd = fs.openSync(full,"r");
            this.mode="r";
            this.resetState();
            return null;
        } else {
            return `openR does not reference a file "${this.path}"`
        }
    }
    async openW(makePath=false): Promise<string | null> {
        if (this.mode != "c"){
            return "openW not closed"
        }
        let {name,parent}=Files.splitParentPath(this.path)
        let validPath=true;
        if (parent)
            validPath=this.validPath(parent,makePath);

        if (validPath){
            let full = this.fullPath();
            try{
                this.fd = fs.openSync(full,"w",0o666);
            } catch {
                return `openW does not reference a file "${this.path}"`
            }
            this.mode="w";
            this.resetState();
            return null;
        } else {
            return `openW does not reference a file "${this.path}"`
        }
    }

    async readChar(): Promise<string | null> {
        if (this.mode!="r"){
            throw "file is not open for read"
        }
        if (this.buffer.length<=this.nextCharIdx){
            let resp: {
                nextRead: number,
                compressed: boolean,
                str: string
            } = await this.readChunk(this.chunkSize, this.readStartIdx)
            if (resp.compressed){
                throw "decompression not done"
            } else {
                this.buffer = resp.str;
            }
            this.readStartIdx = resp.nextRead;
            this.nextCharIdx = 0;
        }
        if (this.buffer.length>this.nextCharIdx){
            let char = this.buffer[this.nextCharIdx];
            this.nextCharIdx++;
            return char;
        } else {
            return null;
        }
        
    }
    readCharSync(): string | null {
        if (this.mode!="r"){
            throw "file is not open for read"
        }
        if (this.buffer.length<=this.nextCharIdx){
            let resp: {
                nextRead: number,
                compressed: boolean,
                str: string
            } = this.readChunkSync(this.chunkSize, this.readStartIdx)
            if (resp.compressed){
                throw "decompression not done"
            } else {
                this.buffer = resp.str;
            }
            this.readStartIdx = resp.nextRead;
            this.nextCharIdx = 0;
        }
        if (this.buffer.length>this.nextCharIdx){
            let char = this.buffer[this.nextCharIdx];
            this.nextCharIdx++;
            return char;
        } else {
            return null;
        }
    }
    async readChunk(chunkSize: number, readPos: number): Promise<{ nextRead: number; compressed: boolean; str: string; }> {
        return this.readChunkSync(chunkSize,readPos)
    }
    readChunkSync(chunkSize: number, readPos: number):{ nextRead: number; compressed: boolean; str: string; }{
        
        if (this.mode!="r"){
            throw "file is not open for read"
        }
        let buffer = Buffer.alloc(chunkSize)
        let nChars = fs.readSync(this.fd,buffer,0,chunkSize,readPos);
        let str = buffer.toString('utf8',0,nChars);
        let rslt = {
            nextRead:readPos + nChars,
            compressed:false,
            str:str
        }
        return rslt;
    }
    async readUntil(char: number): Promise<string> {
        return this.readUntilSync(char);
    }
    readUntilSync(char: number): string {
        if (this.mode != "r")
            throw "file is not open for read";
        let rslt = "";
        let notFound = true;
        let startIdx = this.nextCharIdx;
        while (notFound) {
            if (this.buffer.length <= this.nextCharIdx) {
                let str = this.buffer.substring(startIdx, this.nextCharIdx)
                rslt += str;
                let resp: {
                    nextRead: number,
                    compressed: boolean,
                    str: string
                } = this.readChunkSync(this.chunkSize, this.readStartIdx)
                if (resp.compressed) {
                    this.buffer = decodeURIComponent(resp.str);
                } else {
                    this.buffer = resp.str;
                }
                this.readStartIdx = resp.nextRead;
                this.nextCharIdx = 0
                startIdx = 0;
            }
            if (this.buffer.length == 0) {
                if (rslt.length == 0) {
                    return "";
                } else {
                    return rslt;
                }
            }
            let cn = this.buffer.charCodeAt(this.nextCharIdx)
            if (cn == char && char > 0) {
                let str = this.buffer.substring(startIdx, this.nextCharIdx)
                rslt += str;
                notFound = false;
            } else {
                this.nextCharIdx++
            }
        }
        return rslt;
    }
    private static nl = "\n".charCodeAt(0);
    private static cr = "\r".charCodeAt(0);
    async readln(): Promise<string> {
        return this.readlnSync();
    }
    readlnSync(): string {
        if (this.mode!="r"){
            throw `readAll file not open for read`
        }
        let rslt = this.readUntilSync(FilesFS.nl)
        if (rslt && rslt.charCodeAt(rslt.length - 1) == FilesFS.cr) {
            rslt = rslt.substring(0, rslt.length - 1)
        }
        this.readCharSync();
        return rslt;
    }
    async readAll(): Promise<string> {
        return this.readUntilSync(0);
    }
    readAllSync(): string {
        if (this.mode!="r"){
            throw `readAll file not open for read`
        }
        return this.readUntilSync(0);
    }
    async write(toWrite: string): Promise<void> {
        this.writeSync(toWrite)
    }
    writeSync(toWrite: string) {
        if (this.mode != "w")
            throw "write file not open for write";
        fs.writeSync(this.fd, toWrite);
    }
    async close(): Promise<void> {
        if (this.mode !="c"){
            this.mode="c";
            fs.closeSync(this.fd);
        }
        this.resetState();
    }
    async makeFile(makePath=false): Promise<string | null> {
        let {name,parent} = Files.splitParentPath(this.path)
        let hasPath=true;
        if (parent){
            hasPath = this.validPath(parent,makePath)
        }
        if (hasPath){
            let fullPath = this.fullPath();
            this.openW(makePath);
            this.close();
            return null;
        } else {
            if (makePath)
                return `makeFile: ${parent} is not a valid path`;
            else
                return `makeFile: ${parent} is not a folder`
        }
    }
    async makeFolder(makePath: boolean): Promise<string | null> {
        let {name,parent} = Files.splitParentPath(this.path);
        let hasPath=true;
        if (parent){
            hasPath=this.validPath(parent,makePath);
        }
        if (hasPath){
            if (await this.isFolder()){
                return null
            } else if (await this.isFile()){
                return `makeFolder: "${this.path}" references an existing file`
            }
            let full = this.fullPath();
            try {
                fs.mkdirSync(full)
                return null
            } catch(e) {
                return `makeFolder: "${full}" failed ${e}`
            }
        }
        if (makePath)
            return `makeFolder: ${parent} is not a folder`;
        else
            return `makeFolder: ${parent} is not a folder`
    }
    async copyFolder(newPath: string, makeNew: boolean): Promise<string | null> {
        let src = this.fullPath();
        if (!(await this.isFolder())){
            return `copyFolder: "${this.path}" is not a valid source`
        }
        let destFS = new FilesFS(newPath);
        let msg = await destFS.makeFolder(makeNew)
        if (msg){
            return `copyFolder: "${newPath}" is not a valid destination`
        }
        try {
            await fsPromises.cp(this.fullPath(), destFS.fullPath(), { recursive: true });
            return null;
        }
        catch (err) {
            return `copyFolder: "${this.fullPath()}" to "${destFS.fullPath}" failed ${err}`;
        }
    }
    async delete(recursive?: boolean): Promise<string | null> {
        let {name,parent}=Files.splitParentPath(this.path)
        if (await this.isFile()){
            fs.unlinkSync(this.fullPath())
            return null;
        }
        if (await this.isFolder()){
            let full = this.fullPath();
            if (recursive){
                fs.rmSync(full,{recursive:true,force:true})
                return null;
            } else {
                try {
                    fs.rmdirSync(full);
                    return null;
                } catch (err){
                    if ((<any>err).code === 'ERR_FS_EISDIR' || (<any>err).code === 'ENOTEMPTY'){
                        return `folder "${this.path}" is not empty. Must delete recursive`
                    } else 
                        return `delete "${this.path}" failed ${(<any>err).code}`
                }
            }
        } else {
            return `"${this.path}" does not reference a folder`
        }
        return `"${parent}" does not reference a folder`
    }
    async lastChangeTime(): Promise<number> {
        return this.lastChangeTimeSync();
    }
    lastChangeTimeSync(): number {
        let full = this.fullPath();
        try{
            let stats = fs.statSync(full);
            let time = Math.floor(stats.mtimeMs);
            return time;
        } catch {
            return -1;
        }
    }
    async getInfo(names: string[]): Promise<{ [name: string]: number; }> {
        if (!(await this.isFolder())){
            return {}
        }
        let rslt:{[name:string]:number}={};
        let full = this.fullPath();
        for (let name of names){
            let fsub = new FilesFS(this.path+"/"+name);
            if (await fsub.isFile()){
                try {
                    let stats = await fsPromises.stat(fsub.fullPath())
                    if (stats) {
                        rslt[name]=stats.size;
                    }
                } catch(err) {}
            }
            if (await fsub.isFolder()){
                rslt[name]=0
            }
        }
        return rslt;
    }

    static async clearFileSpace(){
        let root = new FilesFS("");
        let fileNames = await root.fileNames();
        for (let name of fileNames){
            let sub = new FilesFS(root.path+"/"+name)
            await sub.delete()
        }
        let folderNames = await root.folderNames();
        for (let name of folderNames){
            let sub = new FilesFS(root.path+"/"+name)
            await sub.delete(true)
        }
    }
    
    protected validPath(path:string,makeNew=false):boolean{
        let pathParts = path.split("/");
        let root = FilesFS.rootPath;
        let curPath=root;
        if (curPath.lastIndexOf("/")==curPath.length-1){
            curPath = curPath.substring(0,curPath.length-1)
        }
        for (let name of pathParts){
            let next = curPath+"/"+name;
            let stats:fs.Stats | null =  null
            try{ stats = fs.lstatSync(next); } catch {}
            if (stats){
                if (stats.isDirectory()){
                    curPath=next;
                } else {
                    return false;
                }
            } else if (makeNew){
                fs.mkdirSync(next);
                curPath=next
            } else {
                return false;
            }
        }
        return true;
    }
    static normalizePath(path:string):string{
        let n = super.normalizePath(path);
        return n;
    }
    static setRootPath(rootPath:string){
        super.setRootPath(rootPath);
        let zRoot = Files.rootPath;
        let rPath = fsPath.resolve(Files.rootPath)
        super.setRootPath(rPath)
        let p = Files.rootPath;
    }
}

export class FilesFSSource extends FilesSource{
    async getFile(fileName: string, makePath=false): Promise<Files> {
        let rslt =  new FilesFS(fileName);
        rslt.makeFile(makePath);
        return rslt;
    }
    async getFolder(folderName: string, makePath=false): Promise<Files> {
        let rslt =  new FilesFS(folderName);
        rslt.makeFolder(makePath);
        return rslt;
    }

}