import { DB } from "../../../../../Zing3/share/DB";
import { ZCode } from "../../../common/ZT";
import { ReadTableCSV } from "../../tables/ReadTableCSV";
import { ReadTableZMS } from "../../tables/ReadTableZMS";
import { WriteTableCSV } from "../../tables/WriteTableCSV";
import { DataPointsRow } from "../SelectBestDataPoints";




export class DecisionTrainingData {
    features:DecisionFeatureData[]=[];
    examples:DecisionExamples[]=[];
    async build(table:ReadTableZMS):Promise<void>{
        throw "not implemented"
    }
    async readFeatures(featuresTable:ReadTableCSV):Promise<void>{
        this.features=[]
        await featuresTable.openR();
        let dI = featuresTable.columnIdx("decision");
        let srcI = featuresTable.columnIdx("srcId");
        let imI = featuresTable.columnIdx("im");
        let rtI = featuresTable.columnIdx("rt");
        let mzI = featuresTable.columnIdx("mz");
        let ms2I = featuresTable.columnIdx("ms2");
        let dvI = featuresTable.columnIdx("decisionValue");
        let row = await featuresTable.nextRow();
        while (row){
            let dfd:DecisionFeatureData={
                decision:row[dI],
                srcId:row[srcI],
                im:row[imI],
                rt:row[rtI],
                mz:row[mzI],
                ms2:row[ms2I],
                dv:row[dvI]
            }
            this.features.push(dfd);
            row = await featuresTable.nextRow();
        }
        await featuresTable.close();
    }
    async writeUsedFeatures(fTable:WriteTableCSV
        ,featureIndiciesUsed:{[featureIdx:number]:boolean}):Promise<void>{
        for (let fIdxS in featureIndiciesUsed){
            let fIdx = Number.parseInt(fIdxS);
            let d = this.features[fIdx];
            let row = [d.decision,d.srcId,d.rt,d.im,d.mz,d.ms2,d.dv]
            fTable.addRow(row)
        }
    }
    private qIm=-1;
    private qRT=-1;
    private qMz=-1;
    private qMs2=10000000;
        private quantum(q:number|undefined):number{
            if (q && q>0)
                return q
            else
                return 10000000;
        }
    async readExamples(decisions:string[],examplesTable:ReadTableZMS):Promise<void>{
        let examples:{[exampleId:string]:DecisionExamples}={};
        let nFeatures = this.features.length;
        await examplesTable.openR();
        let types = examplesTable.getColTypes();
        let exI = examplesTable.columnIdx("exampleId");
        let outcomes = <string[]>types[exI].type.info.outcomes;
        let codes = (<ZCode>types[exI].type).codes;
        let exampleIdxTable:{[exampleId:string]:number}={}
        for (let code of codes){
            exampleIdxTable[code.name]=<number>code.value;
        }
        let srcI = examplesTable.columnIdx("srcId");
        let imI = examplesTable.columnIdx("im")
        let rtI = examplesTable.columnIdx("rt")
        let mzI = examplesTable.columnIdx("mz");
        let ms2I = examplesTable.columnIdx("ms2")
        let abI = examplesTable.columnIdx("ab")
        this.qIm = this.quantum(types[imI].info.quantum)
        this.qRT = this.quantum(types[rtI].info.quantum)
        this.qMz = this.quantum(types[mzI].info.quantum)
        examplesTable.processRows(async (rowRec:{[field:string]:any})=>{
            let rec = <DataPointsRow>rowRec;
            for (let decision of decisions){
                let fIdx = this.lookupFeatureIdx(decision,rec.srcId,
                    rec.im,rec.rt,rec.mz,rec.ms2
                )
                if (fIdx>=0){
                    for (let exampleId in exampleIdxTable){
                        let exampleIdx = exampleIdxTable[exampleId];
                        if (!examples[exampleId]){
                            examples[exampleId]={
                                id:exampleId,
                                outcome:outcomes[exampleIdx],
                                vals:Array(nFeatures).fill(0)
                            }
                        }
                        examples[exampleId].vals[fIdx]=rec.abs[exampleIdx]
                    }
                }
            }
        
        })
        for (let exampleId in examples){
            let exampleIdx = exampleIdxTable[exampleId];
            this.examples[exampleIdx]=examples[exampleId]
        }
        await examplesTable.close();
    }
    private lookupFeatureIdx(decision:string, srcId:string,
        im:number,rt:number,mz:number,ms2:number):number{
        let nIm = -1;
        if (im>=0)
            nIm = Math.floor((im+0.000000001)/this.qIm)*this.qIm;
        let nRt= -1;
        if (rt>=0)
            nRt = Math.floor((rt+0.000000001)/this.qRT)*this.qRT
        let nMz = -1;
        if (mz>=0) 
            nMz = Math.floor((mz+0.000000001)/this.qMz)*this.qMz
        let nMs2 = -1;
        if (ms2>=0) 
            nMs2 = Math.floor((ms2+0.000000001)/this.qMs2)*this.qMs2
        for (let recI=0;recI<this.features.length;recI++){
            let rec = this.features[recI];
            if (rec.decision==decision
                && rec.srcId==srcId
                && this.near(rec.im,nIm)
                && this.near(rec.rt,nRt)
                && this.near(rec.mz,nMz)
                && this.near(rec.ms2,nMs2)){

                return recI
            }
        }
        return -1;
    }
    private near(a:number,b:number):boolean{
        let diff = a-b;
        if (diff<-0.00000000001)
            return false
        if (diff>0.00000000001)
            return false
        return true;
    }
}
export type DecisionFeatureData = {
    decision:string,
    srcId:string,
    im:number,
    rt:number,
    mz:number,
    ms2:number,
    dv:number
}
export type DecisionExamples = {
    id:string,
    outcome:string,
    vals:number[] // indexed according to features array
}