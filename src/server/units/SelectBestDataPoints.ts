import { Log } from "../../client/log/Log";
import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { ZArray, ZCode, ZDict, ZField, ZNumber, ZString, ZT } from "../../common/ZT";
import { Unit } from "./Unit";
import { ReadTableZMS } from "../tables/ReadTableZMS";
import { MSSieveData } from "../MZML/MSSelectSieve";
import { ReadTableCSV } from "../tables/ReadTableCSV";
import { WriteTableCSV } from "../tables/WriteTableCSV";
import { MsFeature } from "../tables/MassSpecData";
import { FilesFS } from "../files/FilesFS";
import { TableMemBest } from "../../common/TableMemBest";


export class SelectBestDataPoints extends Unit{
    description(): string {
        return `Select the data points that have the best decision values 
            relative to the generated decisions`;
    }
    paramType(): ZT {
        let paramType = new ZDict()
            .num("nDataPointsToSelect",{decimals:0});
        let choice = new ZCode()
            .code("fractionPure","Fraction Pure");
        paramType.add("algorithmId",choice)
        return paramType
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return [
            {inputId:"sampleData",typeName:"ZMS"},
            {inputId:"decisions",typeName:"CSV"}
        ]
    }
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [
            {outputId:"features.csv", typeName:"CSV"},
            //{outputId:"stats.csv", typeName:"CSV"}
        ];
    }
    defaultParam():SelectBestDataPointsParam {
        return {nDataPointsToSelect:1000,
            algorithmId:"fractionPure"
        };
    }
    private param:SelectBestDataPointsParam=<any>undefined;
    async run(instanceInfo: StepRunJSON, log: Log): Promise<boolean> {
        debugger;
        this.param = <SelectBestDataPointsParam>instanceInfo.paramValue;
        let examplesTableName = this.inputFileName("sampleData",instanceInfo);
        let examplesTable = new ReadTableZMS(examplesTableName)
        await examplesTable.openR();
        let quanta:MSSieveData = this.extractQuantaFromCols(examplesTable);
        let decisionsTableName = this.inputFileName("decisions",instanceInfo)
        let decisionsTable = new ReadTableCSV(decisionsTableName);
        await decisionsTable.openR();

        let featuresName = this.outputFileName("features.csv",instanceInfo)
        let features = new WriteTableCSV(featuresName);

        /*let statsName = this.outputFileName("stats.csv",instanceInfo);
        let statsFile = new WriteTableCSV(statsName);
        await statsFile.openW();*/

        await this.buildDecisions(decisionsTable,examplesTable);
        this.retrieveExampleOutcomes(examplesTable)

        let decisionTables:{[decision:string]:TableMemBest}={};
        for (let decision in this.decisions){
            decisionTables[decision]=this.setupTableBest();
        }
        
        let rc=0;
        examplesTable.processRows(async (rowRec:{[field:string]:any})=>{
            let rec = <DataPointsRow>rowRec;
            for (let decision in this.decisions){
                let dt = decisionTables[decision];
                let ab = this.decisions[decision];
                let dv = this.decisionValue(rec,decision);
                dt.addRow([decision,rec.srcId,rec.rt,rec.im,rec.mz,rec.ms2,dv])
                log.status(`data ${(rc++).toLocaleString()}`)
            }
        })
        let cols = this.getOutputColTypes("features.csv")
        this.injectQuantaIntoCols(cols,quanta);
        features.setColTypes(cols)
        await features.openW();
        for (let decision in decisionTables){
            let table = decisionTables[decision];
            table.startRows();
            let row = await table.nextRow();
            while (row){
                await features.addRow(row);
                row = await table.nextRow();
            }
        }
        //this.writeExampleStats(statsFile);
        await examplesTable.close();
        await decisionsTable.close();

        await features.close();
        //await statsFile.close();
        
        return true;
    }
    
    private extractQuantaFromCols(table:ReadTableZMS):MSSieveData{
        let rslt:MSSieveData={
            srcId:"",
            mz:0,
            rt:0,
            im:0,
            ms2:0
        }
        let types = table.getColTypes();
        for (let ty of types){
            let q=ty.info.quantum;
            if (!q)
                q=0;
            switch (ty.fieldName){
                case "mz":
                    rslt.mz=q;
                    break;
                case "rt":
                    rslt.rt=q;
                    break;
                case "im":
                    rslt.im=q;
                    break;
                case "ms2":
                    rslt.ms2=q;
                    break;
                default:
                    break;
            }
        }
        return rslt;
    }
    
    private injectQuantaIntoCols(types:ZField[],quanta:MSSieveData){
        for (let ty of types){
            switch (ty.fieldName){
                case "mz":
                    ty.info.quantum = quanta.mz;
                    break;
                case "rt":
                    ty.info.quantum = quanta.rt;
                    break;
                case "im":
                    ty.info.quantum = quanta.im;
                    break;
                case "ms2":
                    ty.info.quantum = quanta.ms2;
                    break;
                default:
                    break;
            }
        }
    }
    private setupTableBest():TableMemBest{
        let tb = new TableMemBest("decisionValue",this.param.nDataPointsToSelect);
        tb.setColTypes(this.getOutputColTypes("features.csv"))
        return tb;
    }
    
    private decisions:{[decisionName:string]:
        {a:{exId:string,outcome:string,exIdx:number}[]
        ,b:{exId:string,outcome:string,exIdx:number}[]}}={} // a and b example indicies
    private async buildDecisions(decisionsTable:ReadTableCSV,examplesTable:ReadTableZMS){
        let row = await decisionsTable.nextRow();
        let exampleIds = <string[]>examplesTable.getExampleIds();
        let outcomes:{outcome:string,exId:string}[]=[];
        for (let exId of exampleIds){
            outcomes.push({exId:exId,outcome:<string>examplesTable.getOutcome(exId)})
        }
        this.decisions={}
        while (row){
            let decision:{a:{exId:string,outcome:string,exIdx:number}[]
                ,b:{exId:string,outcome:string,exIdx:number}[]}={a:[],b:[]};
            let first = <string>row[0];
            let next = <string>row[1];
            let decisionName=""
            if (next=="*"){
                    // build first against all others
                    decisionName=first+" | *"
                    for (let i=0;i<exampleIds.length;i++){
                        if (outcomes[i].outcome==first){
                            decision.a.push({exId:exampleIds[i],outcome:first,exIdx:i})
                        } else {
                            decision.b.push({exId:exampleIds[i],outcome:outcomes[i].outcome,exIdx:i});
                        }
                    }
                    
            } else {
                    // build first against next
                    decisionName=first+" | "+next;
                    for (let i=0;i<exampleIds.length;i++){
                        if (outcomes[i].outcome==first)
                            decision.a.push({exId:exampleIds[i],outcome:first,exIdx:i})
                        if (outcomes[i].outcome==next)
                            decision.b.push({exId:exampleIds[i],outcome:next,exIdx:i})
                    }
            }
            this.decisions[decisionName]=decision;
            row = await decisionsTable.nextRow();
        }
    }
    private exampleOutcomes:{[exId:string]:string}={}
    private exampleOutcomeList:string[]=[];
    private retrieveExampleOutcomes(examplesTable:ReadTableZMS){
        let exIds = examplesTable.getExampleIds();
        for (let exId of exIds){
            let outcome = examplesTable.getOutcome(exId);
            if (outcome){
                this.exampleOutcomes[exId]=outcome;
                this.exampleOutcomeList.push(outcome);
            }
        }
    }
    //private decisionValue(featureData:MsFeature,decisionName:string):{dv:number,sDVerr:number,hiMerrDV:number,loMerrDV:number}{
    private decisionValue(featureData:MsFeature,decisionName:string):number{
        let decision = this.decisions[decisionName];
        let maxIdx=0;
        for (let exD of decision.a){
            let exIdx=exD.exIdx
            if (exIdx>maxIdx)
                maxIdx=exIdx;
        }
        for (let exD of decision.b){
            let exIdx=exD.exIdx
            if (exIdx>maxIdx)
                maxIdx=exIdx;
        }
        for (let i=0;i<=maxIdx;i++){
            if (!featureData.abs[i])
                featureData.abs[i]=0
        }
        let aValues:{exId:string,val:number}[]=[]
        for (let exD of decision.a){
            let exIdx=exD.exIdx
            aValues.push({exId:exD.exId,val:featureData.abs[exIdx]})
        }
        let bValues:{exId:string,val:number}[]=[]
        for (let exD of decision.b){
            let exIdx=exD.exIdx
            bValues.push({exId:exD.exId,val:featureData.abs[exIdx]})
        }
        aValues.sort((a,b)=>{
            return a.val-b.val
        })
        bValues.sort((a,b)=>{
            return a.val-b.val
        })
        switch(this.param.algorithmId){
            case "fractionPure":
                return this.fractionPureDV(aValues,bValues);
            default:return 0 //{dv:0,sDVerr:0,hiMerrDV:0,loMerrDV:0}
        }
    }
    //private fractionPureDV(aValues:number[],bValues:number[]):{dv:number,sDVerr:number,hiMerrDV:number,loMerrDV:number}{
    private fractionPureDV(aValues:{exId:string,val:number}[]
        ,bValues:{exId:string,val:number}[]):number{

        const OUTLIER_PERCENTILE = 5;
        let minAIdx = Math.round(aValues.length*(OUTLIER_PERCENTILE/100))
        if (minAIdx<0)minAIdx=0;
        let minA = aValues[minAIdx].val
        let maxAIdx = Math.round((aValues.length-1)*(1-OUTLIER_PERCENTILE/100))
        if (maxAIdx>=aValues.length) maxAIdx=aValues.length-1;
        let maxA = aValues[maxAIdx].val
        let minBIdx = Math.round(bValues.length*(OUTLIER_PERCENTILE/100))
        if (minBIdx<0)minBIdx=0;
        let minB = bValues[minBIdx].val
        let maxBIdx = Math.round((bValues.length-1)*(1-OUTLIER_PERCENTILE/100))
        if (maxBIdx>=bValues.length) maxBIdx=bValues.length-1;
        let maxB = bValues[maxBIdx].val
        let dv=0;
        if (maxA>maxB){
            // a is the high range
            if (minA>maxB){
                dv = 1+(minA-maxB)/(maxA-minB)
                if (Number.isNaN(dv))
                    dv=0;
            } else {
                let ltB = this.countLessThan(bValues,minA)
                let gtA = this.countGreater(aValues,maxB)
                dv = (gtA+ltB)/(aValues.length+bValues.length)
            }
        } else {
            // b is the high range
            if (minB>maxA){
                dv = 1+(minB-maxA)/(maxB-minA)
                if (Number.isNaN(dv))
                    dv=0;
            } else {
                let ltA =  this.countLessThan(aValues,minB);
                let gtB = this.countGreater(bValues,maxA);
                dv = (ltA+gtB)/(aValues.length+bValues.length)
            }
        }
        return dv
    }
        private countLessThan(a:{exId:string,val:number}[],n:number):number{
            let cnt=0;
            for (let v of a){
                if (v.val<n)
                    cnt++
            }
            return cnt;
        }
        private countGreater(a:{exId:string,val:number}[],n:number):number{
            let cnt=0;
            for (let v of a){
                if (v.val>n)
                    cnt++
            }
            return cnt;
        }
    private examplesAccum:{[decisionName:string]:
        {[exampleId:string]:
            {   nEntries:number,
                nMissingFeatures:number, // value is 0 when most others are present
                nAddedFeatures:number,  // has value when most others are missing
                aveExtremePercentile:number, // abs(50-percentile)
                avePercentile:number
            }
        }
    }={}
    private async writeExampleStats(exampleStats:WriteTableCSV):Promise<void>{
       exampleStats.setColTypes(this.getOutputColTypes("exampleStats.csv"))
        await exampleStats.openW();
        for (let decisionName in this.examplesAccum){
            let exDecision = this.examplesAccum[decisionName];
            for (let exId in exDecision){
                let exAccum = exDecision[exId];
                let n = exAccum.nEntries;
                exAccum.nMissingFeatures/=n;
                exAccum.nAddedFeatures/=n;
                exAccum.aveExtremePercentile/=n;
                exAccum.avePercentile/=n;
                exampleStats.addRow([
                    decisionName,
                    exId,
                    exAccum.nMissingFeatures,
                    exAccum.nAddedFeatures,
                    Math.abs(0.5-exAccum.avePercentile),
                    exAccum.aveExtremePercentile
                ])
            }
        }
        await exampleStats.close();
    }
    
    getOutputColTypes(outputName: string): ZField[] {
        switch(outputName){
            case "features.csv":
                return [
                    new ZField("decision",new ZString(),{}),
                    new ZField("srcId",new ZString(),{}),
                    new ZField("rt",new ZNumber(),{decimals:3}),
                    new ZField("im",new ZNumber(),{decimals:3}),
                    new ZField("mz",new ZNumber(),{decimals:3}),
                    new ZField("ms2",new ZNumber(),{decimals:3}),
                    new ZField("decisionValue",new ZNumber(),{decimals:3}),
                ]

            case "exampleStats.csv":
                return [
                    new ZField("decision",new ZString(),"decision"),
                    new ZField("exId",new ZString(),{}),
                    new ZField("spuriousFeatures",new ZNumber(),{decimals:2}),
                    new ZField("missingFeatures",new ZNumber(),{decimals:2}),
                    new ZField("fluidError",new ZNumber(),{decimals:2}),
                    new ZField("degradation",new ZNumber(),{decimals:2})
                ]
            default: return[]
        }
    }
}
type SelectBestDataPointsParam = {
    nDataPointsToSelect:number,
    algorithmId:string
}

export type DataPointsRow = {
    srcId:string,
    im:number,
    rt:number,
    mz:number,
    ms2:number,
    abs:number[],
    exIds:string[]
}