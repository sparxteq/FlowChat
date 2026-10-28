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
import { MassSpecData, MsFeature } from "../../tables/MassSpecData"
import { BiClusterModelsSpec } from "./BiClusterModelsSpec";
import { DB } from "../../../../../Zing3/share/DB";


export class ComputeClusters extends Unit{
    description(): string {
        return `Takes data about features and samples and computes cluster trees for them,
            and assembles information about them.`;
    }
    paramType(): ZT {
        return new ZDict()
            .array("sampleInfoColumns",new ZString())
            .num("maxFeatures")
            .code("clusteringAlgorithm",["agglomerative","decisionTree","kMeans","kMeansTree"])
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
            maxFeatures:200,
            clusteringAlgorithm:"agglomerative"
        };
    }
    private wnote:WorkNotify=<any>undefined;
    async run(instanceInfo: StepRunJSON, log: Log): Promise<boolean> {
        //debugger;
        this.wnote = new WorkNotify(log);
        let param = <ComputeClustersParam>instanceInfo.paramValue;
        if (param.maxFeatures>200)
            param.maxFeatures=200;

        let studyName = await this.inputFileName("studySpec",instanceInfo);
        let studyFile = new FilesFS(studyName);
        await studyFile.openR()
        let specStr = await studyFile.readAll();
        let studySpec = <StudySpecificationParam>JSON.parse(specStr)
        await studyFile.close();

        let samplesName = await this.inputFileName("sampleData",instanceInfo);
        let samplesTable = new ReadTableZMS(samplesName);
        await samplesTable.openR();
        let samplesInfo = await this.loadSamples(param,samplesTable,instanceInfo);
        await samplesTable.close();

        let assemblyName = await this.inputFileName("assembly",instanceInfo);
        let assemblyTable = new ReadTableCSV(assemblyName)
        await assemblyTable.openR();
        let assembly = await this.loadAssemblyInfo(param,assemblyTable,studySpec,instanceInfo)
        await assemblyTable.close();

        let featuresName = await this.inputFileName("features",instanceInfo);
        let featuresTable = new ReadTableCSV(featuresName)
        await featuresTable.openR();
        let featuresInfo = await this.loadFeaturesInfo(param,featuresTable,instanceInfo)
        await featuresTable.close();

        let biClusterModels= new BiClusterModelsSpec();
        this.wnote.start("clustering")
        for (let decision in featuresInfo){
            let [outcomeA,outcomeB] = decision.split(" | ");
            let exIdxList:number[]=this.decisionExamples(samplesInfo,outcomeA,outcomeB);
            let featureList=this.decisionFeatures(decision,samplesInfo,featuresInfo)
            let decisionModel = this.buildDecisionModel(decision,featureList,
                exIdxList,studySpec,samplesInfo,assembly,featuresInfo)
            biClusterModels.setModel(decision,decisionModel!)
        }

        let modelName = await this.outputFileName("biCluster.json",instanceInfo);
        let modelFile = new FilesFS(modelName);
        await modelFile.openW();
        let modelsJSON = biClusterModels.toJSON();
        let modelsStr = JSON.stringify(modelsJSON);
        await modelFile.write(modelsStr);
        await modelFile.close();
        this.wnote.end();
        return true;
    }
    private decisionExamples(samplesInfo:SamplesInfo,outcomeA:string,outcomeB:string):number[]{
        let rslt:number[]=[];
        for (let i=0;i<samplesInfo.exampleIds.length;i++){
            let exId = samplesInfo.exampleIds[i];
            let outcome = samplesInfo.exampleOutcomes[exId];
            if (outcomeB=="*")
                rslt.push(i)
            else if (outcomeA==outcome || outcomeB==outcome){
                rslt.push(i)
            }
        }
        return rslt;
    }
    private decisionFeatures(decision:string,samplesInfo:SamplesInfo
            ,featuresInfo:FeaturesInfo,):number[]{
        let dFeatureIdxs:number[]=[]
        let decisionFeatures = featuresInfo[decision];
        for (let feature of samplesInfo.features){
            let featureIdx = this.findFeature(feature,decisionFeatures);
            if (featureIdx>=0)
                dFeatureIdxs.push(featureIdx)
        }
        return dFeatureIdxs;
    }
        private findFeature(feature:MsFeature,decisionFeatures:DecisionFeature[]):number{
            for (let i=0; i<decisionFeatures.length;i++){
                let df = decisionFeatures[i]
                if (feature.mz==df.mz && feature.rt==df.rt && feature.srcId==df.srcId){
                    return i
                }
            }
            return -1
        }
    private buildDecisionModel(decision:string,featureIdxList:number[]
            ,exIdxList:number[],studySpec:StudySpecificationParam,samplesInfo:SamplesInfo
            ,assembly:AssemblyInfo,features:FeaturesInfo):BiClusterModel{
        let biModel = new BiClusterModel();
        for (let x = 0;x<exIdxList.length;x++){
            let exIdx = exIdxList[x];
            for (let y=0;y<featureIdxList.length;y++){
                let fIdx=featureIdxList[y];
                let v = samplesInfo.data[fIdx][exIdx]
                biModel.addValue(x,y,v);
            }
        }
        for (let x=0;x<biModel.maxX();x++){
            let exIdx = exIdxList[x];
            let exId = samplesInfo.exampleIds[exIdx];
            let exampleInfo = assembly[exId]
            biModel.setXInfo(x,exampleInfo)
            biModel.setXItemDescription(x,exId);
        }
        let decisionFeatures = features[decision]
        for (let y=0;y<biModel.maxY();y++){
            let fIdx = featureIdxList[y];
            let df = decisionFeatures[fIdx]
            let meanMZ = df.mz+samplesInfo.quanta.mz/2
            let meanRT = df.rt+samplesInfo.quanta.rt/2
            let desc = `[${meanMZ.toFixed(5)}, ${meanRT.toFixed()}]`
            let info = {
                mzGE:df.mz.toFixed(5),
                mzLT:(df.mz+samplesInfo.quanta.mz).toFixed(5),
                rtGE:df.rt.toFixed(),
                rtLT:(df.rt+samplesInfo.quanta.rt).toFixed()
            }
            biModel.setYInfo(y,info)
            biModel.setYItemDescription(y,desc);
        }

        biModel.normalizeY(true);
        biModel.xClusteredTree();
        biModel.yClusteredTree();
        return biModel;
    }
    
    private async loadSamples(param:ComputeClustersParam,samplesTable:ReadTableZMS,instanceInfo:StepRunJSON):Promise<SamplesInfo>{
        let exampleIds = samplesTable.getExampleIds();
        let cols = samplesTable.getColTypes();
        let mzCol = cols[samplesTable.columnIdx("mz")]
        let rtCol = cols[samplesTable.columnIdx("rt")]
        let mzQuanta = mzCol.info.quantum;
        if (!mzQuanta)
            mzQuanta=1;
        let rtQuanta = rtCol.info.quantum;
        if (!rtQuanta)
            rtQuanta=1;
        let rslt:SamplesInfo = {
            features:[],
            exampleIds:exampleIds,
            exampleOutcomes:{},
            quanta:{mz:mzQuanta,rt:rtQuanta},
            data:{}
        }
        for (let exId of exampleIds){
            let outcome = samplesTable.getOutcome(exId);
            rslt.exampleOutcomes[exId]=outcome!;
        }
        let fIdx=-1;
        samplesTable.processRows(async (rowRec:{[columnName:string]:any}):Promise<void>=>{
            DB.msg("rowRec ",rowRec)
            fIdx++;
            let feature:MsFeature ={
                srcId:rowRec.srcId,
                im:-1,
                rt:rowRec.rt,
                mz:rowRec.mz,
                abs:rowRec.abs,
                exIds:exampleIds
            }
            rslt.features.push(feature);
            for (let exIdx=0;exIdx<feature.exIds.length;exIdx++){
                let exId = feature.exIds[exIdx];
                let ab = feature.abs[exIdx];
                if (!ab)
                    ab=0;
                let featureTable = rslt.data[fIdx]
                if (!featureTable){
                    featureTable={};
                    rslt.data[fIdx]=featureTable;
                }
                let exampleIdx = exampleIds.indexOf(exId);
                featureTable[exampleIdx]=ab;
            }
        })
        /*let feature = await samplesTable.nextFeature();
        let fIdx=-1;
        while (feature){
            fIdx++;
            rslt.features.push(feature);
            for (let exIdx=0; exIdx<feature.exIds.length;exIdx++){
                let exId = feature.exIds[exIdx];
                let ab = feature.abs[exIdx];
                let featureTable = rslt.data[fIdx]
                if (!featureTable){
                    featureTable = {};
                    rslt.data[fIdx]=featureTable;
                }
                let exampleIdx = exampleIds.indexOf(exId);
                featureTable[exampleIdx]=ab;
            }
            feature = await samplesTable.nextFeature()
        }*/
        return rslt;
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
            assemblyInfo[exId]={ }
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
        let rslt:FeaturesInfo={}
        let decIdx = featuresTable.columnIdx("decision")
        let srcIdx = featuresTable.columnIdx("srcId")
        let rtIdx = featuresTable.columnIdx("rt")
        let imIdx = featuresTable.columnIdx("im")
        let mzIdx = featuresTable.columnIdx("mz")
        let ms2Idx = featuresTable.columnIdx("ms2")
        let dvIdx = featuresTable.columnIdx("decisionValue")
        let row = await featuresTable.nextRow();
        while (row){
            if (row[imIdx]==-1 && row[ms2Idx]==-1){
                let df:DecisionFeature = {
                    srcId:row[srcIdx],
                    rt:row[rtIdx],
                    mz:row[mzIdx],
                    decisionValue:row[dvIdx]
                }
                let decision = row[decIdx];
                let dlist = rslt[decision]
                if (!dlist){
                    dlist=[];
                    rslt[decision]=dlist;
                }
                dlist.push(df)
            }
            row = await featuresTable.nextRow();
        }
        for (let decision in rslt){
            let dv = rslt[decision]
            dv.sort((a,b)=>{
                return b.decisionValue-a.decisionValue
            })
            if (dv.length>param.maxFeatures)
                dv.slice(0,param.maxFeatures)
        }
        return rslt;
    }
    
}
type ComputeClustersParam = {
    sampleInfoColumns:string[],
    maxFeatures:number,
    clusteringAlgorithm: "agglomerative" | "decisionTree" | "kMeansTree" | "kMeans"
}
type SamplesInfo = {
    features:MsFeature[],
    exampleIds:string[],
    exampleOutcomes:{[exampleId:string]:string},
    quanta:{mz:number,rt:number}
    data:{[featureIdx:number]:{[exIdx:number]:number}}
}
type AssemblyInfo = {[exampleId:string]:{[column:string]:string | number} }

type FeaturesInfo = {
    [decision:string]:DecisionFeature[]
}
type DecisionFeature = {
    srcId:string,
    rt:number,
    mz:number,
    decisionValue:number
}