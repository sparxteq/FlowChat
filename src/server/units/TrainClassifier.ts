import { Log } from "../../client/log/Log";
import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { ZDict, ZT } from "../../common/ZT";
import { FilesFS } from "../files/FilesFS";
import { ReadTableCSV } from "../tables/ReadTableCSV";
import { ReadTableZMS } from "../tables/ReadTableZMS";
import { WriteTableCSV } from "../tables/WriteTableCSV";
import { WorkNotify } from "../workers/WorkNotify";
import { classifierInit } from "./decisionClassifiers/classifierInit";
import { DecisionTrainer } from "./decisionClassifiers/DecisionTrainer";
import { DecisionTrainingData } from "./decisionClassifiers/DecisionTrainingData";
import { Unit } from "./Unit";



export class TrainClassifier extends Unit {
    description(): string {
        return `Takes the parsed data and the decisions and generates a classifier
                for each decision. Uses holdout technique to evaluate accuracy of 
                classifier`;
    }
    paramType(): ZT {
        return new ZDict()
            .num("dataPointsToUse",{decimals:0})
            .num("percentToHoldOut",{decimals:0})
            .num("nValidations",{decimals:0})
            .code("algorithm",["Bayes","DVVote","NNeighbor"]);
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return [
            {inputId:"sampleData", typeName:this.checkType("SelectedDataPoints")},
            {inputId:"features", typeName:this.checkType("Features")},
            {inputId:"decisions", typeName:this.checkType("Decisions")}
        ]
    }
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [
            {outputId:"classifiers.json",typeName:this.checkType("Classifiers")},
            {outputId:"features.csv",typeName:this.checkType("Features")},
            {outputId:"accuracy.json",typeName:this.checkType("Accuracy")}
        ];
    }
    defaultParam():TrainClassifierParam {
        return {
            dataPointsToUse:10,
            percentToHoldOut:10,
            nValidations:10,
            algorithm:"Bayes"
        }
    }
    private examplesTable?:ReadTableZMS;
    private decisionsTable?:ReadTableCSV;
    private featuresTable?:ReadTableCSV;
    async run(instanceInfo: StepRunJSON, log: Log): Promise<boolean> {
        //debugger;
        classifierInit();
        let decName = this.inputFileName("decisions",instanceInfo)
        this.decisionsTable = new ReadTableCSV(decName);
        let decisions = await this.readDecisions()

        let td = new DecisionTrainingData();
        let ftName = this.inputFileName("features",instanceInfo);
        let ft = new ReadTableCSV(ftName);
        await td.readFeatures(ft);

        let exName = this.inputFileName("sampleData",instanceInfo);
        let ex = new ReadTableZMS(exName);
        await td.readExamples(decisions,ex);

        let param = <TrainClassifierParam>instanceInfo.paramValue;
        let decisionTrainer = new DecisionTrainer(td,param.dataPointsToUse
                ,param.percentToHoldOut,param.nValidations,param.algorithm
        )
        let wnote = new WorkNotify(log);
        let featureIndiciesUsed:{[featureIdx:number]:boolean}={}
        for (let decision of decisions){
            decisionTrainer.trainAccuracy(decision,wnote)
            decisionTrainer.logAccuracy(decision,wnote)
            decisionTrainer.train(decision,featureIndiciesUsed);
        }
        let featName = this.outputFileName("features.csv",instanceInfo);
        let featTable = new WriteTableCSV(featName)
        let cols = ft.getColTypes();
        featTable.setColTypes(cols);
        await featTable.openW();
        await td.writeUsedFeatures(featTable,featureIndiciesUsed)
        
        let accuracyName = this.outputFileName("accuracy.json",instanceInfo)
        let accFile = new FilesFS(accuracyName);
        await accFile.openW();
        let accStr = JSON.stringify(decisionTrainer.accuracy,null,4);
        await accFile.write(accStr);
        let clsName = this.outputFileName("classifiers.json",instanceInfo)
        let clsFile = new FilesFS(clsName);
        await clsFile.openW();
        let clsJSON = decisionTrainer.classifiersToJSON();
        let clsStr = JSON.stringify(clsJSON,null,4)
        await clsFile.write(clsStr);

        await clsFile.close();
        await featTable.close();
        await accFile.close();
        await this.decisionsTable.close();
        await ft.close();
        await ex.close();

        return true;
    }
    
    private async readDecisions():Promise<string[]>{
        if (!this.decisionsTable)
            throw "no decisionTable"
        await this.decisionsTable.openR();
        let rslt:string[]=[];
        let row = await this.decisionsTable.nextRow();
        while (row){
            let decision = `${row[0]} | ${row[1]}`
            rslt.push(decision);
            row = await this.decisionsTable.nextRow();
        }
        await this.decisionsTable.close();
        return rslt;
    }
    
}
type TrainClassifierParam = {
    dataPointsToUse:number,
    percentToHoldOut:number,
    nValidations:number,
    algorithm:string
}