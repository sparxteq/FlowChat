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
    let assemblyType = new TypeS("Assembly",["CSV","table"],"An assembly file of source information")
    let decisions = new TypeS("Decisions",["CSV","table"],"List of decision pairs")
    let features = new TypeS("Features",["CSV","table"],"Data about features being used")

    let jsonType = new TypeS("JSON",[],"json file")
    let studySpec = new TypeS("StudySpec",["JSON"],"Specification of how the study is to be constructed")
    let quanta = new TypeS("Quanta",["JSON"],"Quanta settings for generating data points")
    let classifiers = new TypeS("Classifiers",["JSON"],"Specs for classifier implementation")
    let accuracy = new TypeS("Accuracy",["JSON"],"Classifier accuracy information")
    
    let zmsType = new TypeS("ZMS",["table"],`A special format that encodes the various
            features into a uniform representation`)
    let allFeatures = new TypeS("AllDataPoints",["ZMS"],"Data that includes all data points")
    let selectedFeatures = new TypeS("SelectedDataPoints",["ZMS"],"Data for only selected data points")
    
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