
/**
 * This is the superclass for all file access. There are at least two
 * subclasses. One for the client side that works through HTTP
 * requests to fullfill the request and one for the server
 * side that directly operates on the file system. There is also a subclass that
 * works completely in memory for testing purposes.
 */
export abstract class ZFiles {
        /**
         * If this is on the server side, this is the root folder
         * for the file system. On this client side it simply
         * starts with "/"
         */
    protected static rootPath:string="";
        /**
         * This is the path of a file or folder relative to the 
         * root
         */
    protected path:string;
        /**
         * 
         * @param path the path relative to the root for this
         * file or folder
         */
    constructor(path:string){
        this.path=path;
    }
        /**
         * 
         * @returns The path for this file or folder relative to
         * the root.
         */
    relativePath():string{
        return this.path;
    }
        /**
         * 
         * @param rootPath The path from the system root to
         * the root for this file system
         */
    static setRootPath(rootPath:string){
        let nRootPath = this.normalizePath(rootPath);
        if (nRootPath.endsWith("/"))
            ZFiles.rootPath=nRootPath
        else 
            ZFiles.rootPath=nRootPath+"/"
    }
        /**
         * 
         * @returns the root path
         */
    static getRootPath():string{
        return ZFiles.rootPath;
    }
        /**
         * @returns the full path including the root. This
         * is only helpful on the server side
         */
    fullPath():string{
        let path=this.path
        if (path.indexOf("/")==0){
            if (ZFiles.rootPath.lastIndexOf("/")==ZFiles.rootPath.length-1)
                path=path.substring(1);
        }
        return ZFiles.rootPath+path;
    }
        /**
         * 
         * @param path a path name 
         * @returns the path name with all relative references
         * expanded (such as ..)
         */
    static normalizePath(path:string):string{
        if (path.indexOf("..")>=0)
            throw `ZFiles.normalizePath: ${path} contains ".."`
        let rPath = path.replace(/\\/g, "/");
        return rPath;
    }

        /**
         * @returns true if the path referenced by this
         * object is a file.
         */
    abstract isFile():Promise<boolean>;
        /**
         * @returns true if the path referenced by this 
         * object is a folder
         */
    abstract isFolder():Promise<boolean>;
        /**
         * @returns a list of file names inside the folder
         * referenced by this path. If the path is not a folder
         * then an empty array is returned.
         */
    abstract fileNames():Promise<string[]>;
        /**
         * @returns a list of folder names inside the folder
         * referenced by this path. If the path is not a folder
         * then an empty array is returned.
         */
    abstract folderNames():Promise<string[]>;
        /**
         * @returns null if this references a file and it
         * is successfully opened for reading. If not so
         * then an error message is returned.
         */
    abstract openR():Promise<string|null>;
        /**
         * @param makePath if true the path to the file and the file
         * will be created.
         * @returns null if this references a file and it
         * is successfully opened for writing. If not so
         * then an error message is returned.
         */
    abstract openW(makePath:boolean):Promise<string|null>;

        /**
         * @returns the next character. If this is not
         * open for reading or end of file has been reached,
         * null is returned.
         */
    abstract readChar():Promise<string|null>;
        /**
         * @returns the next character. If this is not
         * open for reading or end of file has been reached,
         * null is returned.
         */
    abstract readCharSync():string | null;
        /**
         * Reads a chunk of characters from a file.
         * @param chunkSize the number of characters to be read
         * @param readPos the zero relative position of the
         * first character to be read
         * @returns nextRead is the number to be used as readPos
         * when reading sequentially.
         * compressed is true of the string is compressed.
         * str is the string that was read. If end of file
         * was reached then this is of length zero.
         */
    abstract readChunk(chunkSize:number,readPos:number):Promise<{
        nextRead:number,
        compressed:boolean,
        str:string
    }>
        /**
         * Read and discard characters until char is found.
         * @param char the character to stop the read
         */
    abstract readUntil(char:number):Promise<string>;
        /**
         * Read and discard characters until char is found.
         * @param char the character to stop the read
         */
    abstract readUntilSync(char:number):string;
        /**
         * Read a full line from the file, discarding the
         * new line \n at the end.
         */
    abstract readln():Promise<string>;
        /**
         * Read a full line from the file, discarding the
         * new line \n at the end.
         */
    abstract readlnSync():string;
        /**
         * Read the entire file as a single string.
         */
    abstract readAll():Promise<string>;
        /**
         * Read the entire file as a single string.
         */
    abstract readAllSync():string;
        /**
         * 
         * @param toWrite the string to be written to the file
         */
    abstract write(toWrite:string):Promise<void>;
        /**
         * 
         * @param toWrite the string to be written to the file
         */
    abstract writeSync(toWrite:string):any;
        /**
         * 
         * @param toWrite the string to be written to the file followed by a new line
         */
    async writeln(line:string):Promise<void>{
        await this.writelnSync(line)
    }
    writelnSync(line:string):void{
        this.writeSync(line+"\n")
    }
        /**
         * Close and terminate any connection to the file
         */
    abstract close():Promise<void>;
        /**
         * Create a new file at the path name specified by 
         * this.path. 
         * @param makePath if this is true then create any
         * necessary folders on the math
         * @returns null if the make was successful or an
         * error message otherwise.
         */
    abstract makeFile(makePath:boolean):Promise<string|null>;
        /**
         * Create a new folder at the path name specified by 
         * this.path. 
         * @param makePath if this is true then create any
         * necessary folders on the math
         * @returns null if the make was successful or an
         * error message otherwise.
         */
    abstract makeFolder(makePath:boolean):Promise<string|null>;
        /**
         * make a full recursive copy of the folder referenced
         * by this.path
         * @param newPath the path relative to the root where
         * the new folder is to be created.
         * @param makeNew if this is true then any folders
         * necessary will be created to get to the newPath.
         */
    abstract copyFolder(newPath:string,makeNew:boolean):Promise<string|null>;
        /**
         * delete this file/folder
         * @param recursive is this is true and the path leads to 
         * a folder then the contents of the folder will be recursively
         * deleted.
         */
    abstract delete(recursive?:boolean):Promise<string|null>
        /**
         * @returns the UTC or universal time code when this
         * file or folder was last changed. This is NOT local
         * time.
         * If this is not a valid file/folder reference then -1 is returned
         */
    abstract lastChangeTime():Promise<number>;
        /**
         * 
         * @param after time to be checked
         * @returns true if after is more than one second after the last change time
         */
    async afterLastChange(after:number):Promise<boolean>{
        let lct = await this.lastChangeTime();
        return lct+1000 < after
    }
        /**
         * @returns the UTC or universal time code when this
         * file or folder was last changed. This is NOT local
         * time. If this is not a valid file/folder reference then -1 is returned
         */
    abstract lastChangeTimeSync():number;
        /**
         * 
         * @param after time to be checked
         * @returns true if after is more than one second after the last change time
         */
    afterLastChangeSync(after:number):boolean{
        let lct = this.lastChangeTimeSync();
        return lct+1000 < after
    }
        /**
         * 
         * @param names names of files or folders to be interrogated
         * @returns the name and size of each file that exists
         * from the list of names. Folders return a filesize of 0.
         */
    abstract getInfo(names:string[]):Promise<{ [name: string]: number }>;
        /**
         * 
         * @param path A file path name.
         * @returns the extension for this file (not including the dot)
         */
    static extension(path:string):string{
        let lastI = path.lastIndexOf(".");
        if (lastI<0)
            return "";
        let ext = path.substring(lastI+1);
        return ext;
    }
    static splitParentPath(path:string):{parent?:string,name?:string}{
        if (path.endsWith("/"))
            path=path.substring(0,path.length-1)
        let idx = path.lastIndexOf("/");
        if (idx<0){
            return {name:path}
        } else {
            let name = path.substring(idx+1);
            let parent = path.substring(0,idx);
            return {
                name:name,
                parent:parent
            }
        }
    }
}

export abstract class ZFilesSource{
    abstract getFile(fileName:string,makePath:boolean):Promise<ZFiles>;
    abstract getFolder(folderName:string,makePath:boolean):Promise<ZFiles>;
}