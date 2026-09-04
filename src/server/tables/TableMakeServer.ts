import { FilesFS } from "../files/FilesFS";
import { ReadTable } from "./ReadTable";
import { ReadTableCSV } from "./ReadTableCSV";
import { ReadTableCSVDesc } from "./ReadTableCSVDesc";
import { ReadTableZMS } from "./ReadTableZMS";
import { WriteTable } from "./WriteTable";
import { WriteTableCSV } from "./WriteTableCSV";
import { WriteTableCSVDesc } from "./WriteTableCSVDesc";
import { WriteTableZMS } from "./WriteTableZMS";


export function readTable(fileName:string):ReadTable |undefined{
    let ext = FilesFS.extension(fileName)
    switch(ext.toLowerCase()){
        case "csv":
            return new ReadTableCSV(fileName)
        case "csvd":
            return new ReadTableCSVDesc(fileName)
        case "zms":
            return new ReadTableZMS(fileName);
    }
}

export function writeTable(fileName:string):WriteTable |undefined{
    let ext = FilesFS.extension(fileName)
    switch(ext.toLowerCase()){
        case "csv":
            return new WriteTableCSV(fileName)
        case "csvd":
            return new WriteTableCSVDesc(fileName)
        case "zms":
            return new WriteTableZMS(fileName);
    }
}