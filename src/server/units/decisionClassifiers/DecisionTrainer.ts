import { classifierMake } from "./classifierMake";
import { DecisionClassifier } from "./DecisionClassifier";
import { DecisionTrainingData } from "./DecisionTrainingData";
import { WorkNotifyI } from "../../workers/WorkNotifyI";



export class DecisionTrainer {
    nDataPoints=1;
    percentHoldout=10;
    nValidations=3;
    algorithmId="";
    accuracy:{[decision:string]:DecisionAccuracy}={};
    classifiers:{[decision:string]:DecisionClassifier}={};
    protected trainingData:DecisionTrainingData;
    protected featuresToUse:{featureIdx:number, decisionValue:number}[]=[];
    constructor(trainingData:DecisionTrainingData,nDataPoints:number
            ,percentHoldout:number,nValidations:number,algorithmId:string){
        this.nDataPoints=nDataPoints;
        this.percentHoldout=percentHoldout;
        this.nValidations=nValidations;
        this.algorithmId=algorithmId;
        this.trainingData=trainingData;
    }
    train(decision:string):DecisionClassifier{
        this.chooseFeaturesToUse(decision);
        let classifier = classifierMake(this.algorithmId,decision);
        let examplesToUse:number[]=[];
        let nExamples = this.trainingData.examples.length;
        for (let ex=0;ex<nExamples;ex++)
            examplesToUse.push(ex);
        classifier.train(this.trainingData,decision,examplesToUse,this.featuresToUse);
        this.classifiers[decision]=classifier;
        return classifier;
    }
    logAccuracy(decision:string,wnote:WorkNotifyI){
        let acc = this.accuracy[decision];
        this.logExamples(acc.failedExamples,"failed",wnote)
        this.logExamples(acc.successExamples,"success",wnote)
        let ave = acc.sum/acc.nValidations;
        wnote.msg(`average confidence ${ave}`)
        let nSuccess = Object.keys(acc.successExamples).length;
        let nFail = Object.keys(acc.failedExamples).length;
        let avSuccess = nSuccess/(nSuccess+nFail)
        wnote.msg(`average correct ${avSuccess}`)
    }
        private logExamples(ex:DecisionAccuracyExampleCounts,label:string,wnote:WorkNotifyI){
            wnote.start(label);
            for (let exId in ex){
                let exD = ex[exId]
                let str = `${exId} number ${exD.count} ave confidence ${exD.confidenceSum/exD.count}`
                wnote.msg(str);
            }
            wnote.end();
        }
    trainAccuracy(decision:string,wnote:WorkNotifyI){
        this.chooseFeaturesToUse(decision);
        let classifier = classifierMake(this.algorithmId,decision);
        let acc:DecisionAccuracy={
            failedExamples:{},
            successExamples:{},
            min:Number.MAX_SAFE_INTEGER,
            max:Number.MIN_SAFE_INTEGER,
            nValidations:this.nValidations,
            sum:0
        }
        for (let i=0;i<this.nValidations;i++){
            wnote.logStatus(`validation ${i+1}/${this.nValidations}`)
            let {examplesToUse, holdoutExamples} = this.examplesToUse(decision);
            classifier.train(this.trainingData,decision,examplesToUse,this.featuresToUse)
            for (let holdoutIdx of holdoutExamples){
                let allFeatures = this.trainingData.examples[holdoutIdx].vals;
                let correct = this.trainingData.examples[holdoutIdx].outcome;
                let features = this.extractFeatureVector(this.featuresToUse,allFeatures);
                let {outcome,confidence} = classifier.eval(features);
                if (correct == outcome)
                    this.logSuccess(acc,holdoutIdx,confidence)
                else if (outcome =="*")
                    this.logSuccess(acc,holdoutIdx,confidence)
                else 
                    this.logFail(acc,holdoutIdx,confidence)
            }
        }
        this.accuracy[decision]=acc;
    }
        private extractFeatureVector(featuresToUse:{featureIdx:number, decisionValue:number}[]
            ,allFeatures:number[]):number[]{

            let rslt:number[]=[];
            for (let ftu of featuresToUse){
                let v = allFeatures[ftu.featureIdx]
                if (!v)
                    v=0;
                rslt.push(v)
            }
            return rslt;
        }
        private logSuccess(acc:DecisionAccuracy,exampleIdx:number, confidence:number){
            let exampleId = this.trainingData.examples[exampleIdx].id
            if (!acc.successExamples[exampleId])
                acc.successExamples[exampleId]={count:0,confidenceSum:0}
            acc.successExamples[exampleId].count++;
            acc.successExamples[exampleId].confidenceSum+=confidence;

            acc.sum+=confidence;
            if (acc.min>confidence)
                acc.min=confidence
            if (acc.max<confidence)
                acc.max=confidence;
        }
        private logFail(acc:DecisionAccuracy,exampleIdx:number, confidence:number){
            let exampleId = this.trainingData.examples[exampleIdx].id
            if (!acc.failedExamples[exampleId])
                acc.failedExamples[exampleId]={count:0,confidenceSum:0}
            acc.failedExamples[exampleId].count++;
            acc.failedExamples[exampleId].confidenceSum+=confidence;

            acc.sum+=confidence;
            if (acc.min>confidence)
                acc.min=confidence
            if (acc.max<confidence)
                acc.max=confidence;
        }
    private chooseFeaturesToUse(decision:string){
        let features = this.trainingData.features;
        this.featuresToUse=[];
        for (let fIdx=0;fIdx<features.length;fIdx++){
            if (features[fIdx].decision==decision)
                this.featuresToUse.push({featureIdx:fIdx,decisionValue:features[fIdx].dv})
        }
        this.featuresToUse.sort((a,b)=>{
            return b.decisionValue-a.decisionValue
        })
        this.featuresToUse.splice(this.nDataPoints)
    }
    protected decisionAB(decision:string):{aEx:number[],bEx:number[]}{
        let parts = decision.split(" | ");
        let aEx:number[]=[];
        let bEx:number[]=[];
        let aOutcome = parts[0];
        let bOutcome = parts[1];
        for (let exIdx=0;exIdx<this.trainingData.examples.length;exIdx++){
            let ex = this.trainingData.examples[exIdx]
            if (ex.outcome==aOutcome){
                aEx.push(exIdx)
            } else if (bOutcome=="*"){
                bEx.push(exIdx)
            } else if (ex.outcome==bOutcome){
                bEx.push(exIdx);
            }
        }
        return {aEx:aEx,bEx:bEx}
    }
    private examplesToUse(decision:string):{examplesToUse:number[],holdoutExamples:number[]}{  
        let holdoutIdx:number[]=[];
        let aOutcome = decision.split(" | ")[0];
        let bOutcome = decision.split(" | ")[1];
        let {aEx,bEx} = this.decisionAB(decision)  
        let nExamples = aEx.length+bEx.length; 
        let nHoldout = Math.floor(this.percentHoldout/100*nExamples)
        if (nHoldout<=0)
            nHoldout=1;
        for (let i=0;i<nHoldout;i++){
            let holdout=-1;
            while (holdout<0) {
                let r = Math.random();
                holdout = Math.floor(r*nExamples-0.00000000001);
                if (holdout>=0 && holdoutIdx.indexOf(holdout)<0){ // this holdout not used
                    if (this.isDecisionOutcome(holdout,aOutcome,bOutcome)){
                        holdoutIdx.push(holdout)
                    } else 
                        holdout=-1; // try again
                } else 
                    holdout=-1; // try again
            }
        }
        let include:number[]=[];
        let holdout:number[]=[];
        for (let i=0;i<aEx.length;i++){
            if (holdoutIdx.indexOf(i)<0)
                include.push(aEx[i])
            else
                holdout.push(aEx[i])
        }
        for (let i=aEx.length;i<nExamples;i++){
            if (holdoutIdx.indexOf(i)<0)
                include.push(bEx[i-aEx.length])
            else
                holdout.push(bEx[i-aEx.length])
        }
        return {examplesToUse:include,holdoutExamples:holdout};
    }
        private isDecisionOutcome(idx:number,a:string,b:string):boolean{
            let outcome = this.trainingData.examples[idx].outcome;
            if (outcome == a)
                return true;
            else if (outcome == b || b=="*"){
                return true;
            }
            return false;
        }
    classifiersToJSON():any{
        let rslt:{[decision:string]:any}={}
        for (let decision in this.classifiers){
            let decJSON = this.classifiers[decision].toJSON();
            rslt[decision]=decJSON;
        }
        return rslt;
    }
}


export type DecisionAccuracy={
    failedExamples:DecisionAccuracyExampleCounts,
    successExamples:DecisionAccuracyExampleCounts,
    min:number,
    max:number,
    nValidations:number,
    sum:number // divide by nValidations for average accuracy.
}
type DecisionAccuracyExampleCounts = {
    [exampleId:string]:{
        count:number,
        confidenceSum:number
    }
}