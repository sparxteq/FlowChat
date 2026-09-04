


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