


export function validExtension(ext:string):boolean{
    switch(ext.toLowerCase()){
        case "csv":
        case "csvd":
        case "zms":
            return true;
        default:
            return false;
    }
}
export function fileExtension(path:string):string{
    let lastI = path.lastIndexOf(".");
    if (lastI<0)
        return "";
    let ext = path.substring(lastI+1);
    return ext;
}