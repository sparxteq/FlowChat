import { MergeRows } from "./MergeRows";
import { ParseAllDataPoints } from "./ParseAllDataPoints";
import { ParseSelectedDataPoints } from "./ParseSelectedDataPoints";
import { RandomRowSelect } from "./RandomRowSelect";
import { RandomTable } from "./RandomTable";
import { SelectAssembly } from "./SelectAssembly";
import { SelectBestDataPoints } from "./SelectBestDataPoints";
import { GenerateParseList } from "./GenerateParseList";
import { TypeS } from "./types/TypeS";
import { Unit } from "./Unit";
import { StudySpecification } from "./StudySpecification";
import { TrainClassifier } from "./TrainClassifier";

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
    Unit.register(new ParseSelectedDataPoints())
    Unit.register(new GenerateParseList())
    Unit.register(new TrainClassifier())
}