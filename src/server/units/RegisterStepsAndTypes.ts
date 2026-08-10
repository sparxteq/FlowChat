import { MergeRows } from "./MergeRows";
import { RandomTable } from "./RandomTable";
import { TypeS } from "./types/TypeS";
import { Unit } from "./Unit";

export function registerStepsAndTypes(){
    
    let tableType = new TypeS("table",[],"A row/column table of data")
    
    Unit.register(new RandomTable())
    Unit.register(new MergeRows())
}