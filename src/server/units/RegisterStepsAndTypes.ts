import { MergeRows } from "./MergeRows";
import { RandomTable } from "./RandomTable";
import { SelectAssembly } from "./SelectAssembly";
import { TypeS } from "./types/TypeS";
import { Unit } from "./Unit";

export function registerStepsAndTypes(){
    
    let tableType = new TypeS("table",[],"A row/column table of data")
    let CSVType = new TypeS("CSV",["table"],"Comma separated value table")
    Unit.register(new RandomTable())
    Unit.register(new MergeRows())
    Unit.register(new SelectAssembly())
}