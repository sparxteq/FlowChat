import { Log } from "../../../client/log/Log";
import { TableMem } from "../../../common/TableMem";
import { TypeName, StepRunJSON } from "../../../common/WorkbookJSON";
import { ZDict, ZString, ZT } from "../../../common/ZT";
import { FilesFS } from "../../files/FilesFS";
import { ReadTableCSV } from "../../tables/ReadTableCSV";
import { ReadTableZMS } from "../../tables/ReadTableZMS";
import { WorkNotify } from "../../workers/WorkNotify";
import { StudySpecificationParam } from "../StudySpecification";
import { Unit } from "../Unit";
import { BiClusterModel } from "./BiClusterModel";


export class ComputeClusters extends Unit{
    description(): string {
        return `Takes data about features and samples and computes cluster trees for them,
            and assembles information about them.`;
    }
    paramType(): ZT {
        return new ZDict()
            .array("sampleInfoColumns",new ZString())
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return [
            {inputId:"sampleData",typeName:this.checkType("SelectedDataPoints")},
            {inputId:"assembly",typeName:this.checkType("Assembly")},
            {inputId:"features", typeName:this.checkType("Features")},
            {inputId:"studySpec", typeName:this.checkType("StudySpec")}
        ];
    }
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [
            {outputId:"biCluster.json",typeName:this.checkType("BiClusterTree")}
        ]
    }
    defaultParam():ComputeClustersParam {
        return {
            sampleInfoColumns:[],
            clusteringAlgorithm:"agglomerative"
        };
    }
    private wnote:WorkNotify=<any>undefined;
    async run(instanceInfo: StepRunJSON, log: Log): Promise<boolean> {
        this.wnote = new WorkNotify(log);
        let param = <ComputeClustersParam>instanceInfo.paramValue;
        
        let studyName = await this.inputFileName("studySpec",instanceInfo);
        let studyFile = new FilesFS(studyName);
        await studyFile.openR()
        let specStr = await studyFile.readAll();
        let studySpec = <StudySpecificationParam>JSON.parse(specStr)

        let samplesName = await this.inputFileName("sampleData",instanceInfo);
        let samplesTable = new ReadTableZMS(samplesName);
        await samplesTable.openR();
        let samplesMem = await this.loadSamples(param,samplesTable,instanceInfo);

        let assemblyName = await this.inputFileName("assembly",instanceInfo);
        let assemblyTable = new ReadTableCSV(assemblyName)
        await assemblyTable.openR();
        let assembly = await this.loadAssemblyInfo(param,assemblyTable,studySpec,instanceInfo)

        let featuresName = await this.inputFileName("features",instanceInfo);
        let featuresTable = new ReadTableCSV(featuresName)
        await featuresTable.openR();
        let featuresInfo = await this.loadFeaturesInfo(param,featuresTable,instanceInfo)

        let biClusterModel:BiClusterModel;
        this.wnote.start(param.clusteringAlgorithm)
        switch (param.clusteringAlgorithm){
            case "agglomerative":
                throw "agglomerative not implemented"
                break;
            case "decisionTree":
                throw "decisionTree not implemented"
                break;
            case "kMeans":
                throw "kMeans not implemented"
                break;
            case "kMeansTree":
                throw "kMeansTree not implemented"
                break;
        }
        this.wnote.end();
        return true;
    }
    private async loadSamples(param:ComputeClustersParam,samplesTable:ReadTableZMS,instanceInfo:StepRunJSON):Promise<TableMem>{
        return new TableMem();
    }
    private async loadAssemblyInfo(param:ComputeClustersParam
            ,assemblyTable:ReadTableCSV,studySpec:StudySpecificationParam
            ,instanceInfo:StepRunJSON):Promise<AssemblyInfo>{
        this.wnote.start("loadAssemblyInfo")
        let tableColumns = assemblyTable.colNames();
        this.validateSelectedInfoColumns(param.sampleInfoColumns,studySpec,tableColumns)
        let assemblyInfo:AssemblyInfo = {};
        let row = await assemblyTable.nextRow();
        let exColIdx = assemblyTable.columnIdx(studySpec.exampleColumn)
        let outcomeColIdx = assemblyTable.columnIdx(studySpec.outcomeColumn)
        while (row){
            let exId = row[exColIdx]
            let outcome = row[outcomeColIdx]
            assemblyInfo[exId]={ _outcome:outcome}
            for (let iCol of param.sampleInfoColumns){
                let iColIdx = assemblyTable.columnIdx(iCol);
                let colInfo = row[iColIdx];
                assemblyInfo[exId][iCol]=colInfo
            }
            row = await assemblyTable.nextRow();
        }

        this.wnote.end();
        return assemblyInfo;
    }
        private validateSelectedInfoColumns(infoColumns:string[],studySpec:StudySpecificationParam
                ,tableColumns:string[]){
            let errorCols:string[]=[];
            for (let iCol of infoColumns){
                let tColIdx = tableColumns.indexOf(iCol)
                if (tColIdx<0){
                    errorCols.push(`${iCol} not a valid colum in assembly file`)
                } else if (iCol==studySpec.exampleColumn){
                    errorCols.push(`${iCol} is already the example id`)
                } else if (iCol== studySpec.outcomeColumn){
                    errorCols.push(`${iCol} is already the oucome`)
                } else if (studySpec.sourceColumns.indexOf(iCol)>=0){
                    errorCols.push(`${iCol} contains source files`)
                }
            }
            if (errorCols.length>0){
                for (let ec of errorCols){
                    this.wnote.msg(ec)
                }
                throw "invalid info columns"
            }
        }
    private async loadFeaturesInfo(param:ComputeClustersParam,featuresTable:ReadTableCSV,instanceInfo:StepRunJSON):Promise<FeaturesInfo>{
        return {}
    }
    
}
type ComputeClustersParam = {
    sampleInfoColumns:string[],
    clusteringAlgorithm: "agglomerative" | "decisionTree" | "kMeansTree" | "kMeans"
}
type AssemblyInfo = {[exampleId:string]:{[column:string]:string | number | string[]} }
type FeaturesInfo = {
    
}