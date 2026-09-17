import { MergeRows } from "./MergeRows";
import { ParseAllDataPoints } from "./ParseAllDataPoints";
import { RandomRowSelect } from "./RandomRowSelect";
import { RandomTable } from "./RandomTable";
import { SelectAssembly } from "./SelectAssembly";
import { SelectBestDataPoints } from "./SelectBestDataPoints";
import { StudySpecification } from "./StudySpecification";
import { TypeS } from "./types/TypeS";
import { Unit } from "./Unit";

export function registerStepsAndTypes(){
    
    let tableType = new TypeS("table",[],"A row/column table of data")
    let CSVType = new TypeS("CSV",["table"],"Comma separated value table")
    let jsonType = new TypeS("JSON",[],"json file")
    let zmsType = new TypeS("ZMS",["table"],`A special format that encodes the various
            features into a uniform representation`)
            
    Unit.register(new RandomTable())
    Unit.register(new MergeRows())
    Unit.register(new SelectAssembly())
    Unit.register(new StudySpecification())
    Unit.register(new RandomRowSelect())
    Unit.register(new ParseAllDataPoints())
    Unit.register(new SelectBestDataPoints())
}