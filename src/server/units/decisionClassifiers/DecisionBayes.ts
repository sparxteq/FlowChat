import { DecisionClassifier } from "./DecisionClassifier";
import { DecisionTrainingData } from "./DecisionTrainingData";
import { BayesSplit } from "./BayesSplit";
import { DB } from "../../../../../Zing3/share/DB";


export class DecisionBayes extends DecisionClassifier{
    algorithmId():string{ return "Bayes"}
    private featuresToUse:{featureIdx:number,decisionValue:number}[]=[]
    train(trainingData: DecisionTrainingData, decision: string
        , examplesToUse: number[]
        , featuresToUse: { featureIdx: number; decisionValue: number; }[]): void {

        this.decision=decision
        this.trainingData = trainingData;
        this.featuresToUse=featuresToUse;
        let {aEx,bEx}=this.splitAB(decision,examplesToUse);
        this.evalSplits=[];
        this.splits={};
        for (let ftu of featuresToUse){
            this.trainFeature(ftu,aEx,bEx)
        }
    }
    private evalSplits:BayesSplit[]=[];
    private splits:{[fIdx:number]:BayesSplit}={}
    private trainFeature(ftu:{featureIdx:number,decisionValue:number},aEx:number[],bEx:number[]){
        let aValues = this.featureValues(ftu,aEx);
        let bValues = this.featureValues(ftu,bEx);
        let split = new BayesSplit()
        split.train(aValues,bValues);
        this.splits[ftu.featureIdx]=split;
        this.evalSplits.push(split);
    }
    private featureValues(ftu:{featureIdx:number,decisionValue:number},exampleIdxs:number[]):number[]{
        if (!this.trainingData) return [];
        let rslt:number[]=[];
        for (let exIdx of exampleIdxs){
            let ex = this.trainingData.examples[exIdx];
            let v = ex.vals[ftu.featureIdx]
            if (!v)
                v=0;
            rslt.push(v);
        }
        return rslt;
    }
    eval(featureVals: number[]): { outcome: string; confidence: number; } {
        let aSum=0;
        let bSum=0;
        let outcomes = this.decision.split(" | ")
        for (let i=0;i<this.featuresToUse.length;i++){
            let ftu = this.featuresToUse[i];
            let v = featureVals[i];
            let split = this.splits[i];
            if (!split){
                DB.msg("missing split",i)
            } else {
                let {outcome,confidence}=split.decide(v);
                if (outcome=="A"){
                    aSum+=confidence;
                } else {
                    bSum+=confidence;
                }
            }
        }
        if (aSum>bSum){
            return {outcome:outcomes[0],confidence:(aSum-bSum)/aSum}
        } else {
            return {outcome:outcomes[1],confidence:(bSum-aSum)/bSum}
        }
    }
    protected subToJSON(json: any) {
        json.featuresToUse=this.featuresToUse;
        json.decision=this.decision;
        json.splits={};
        for (let fIdx in this.splits){
            json.splits[fIdx]=this.splits[fIdx].toJSON();
        }
        json.splits=this.splits
        return json
    }
    fromJSON(json: any): void {
        this.decision=json.decision;
        this.splits={};
        let splits = json.splits;
        for (let fIdx=0;fIdx<splits.length;fIdx++){
            let splitJSON = splits[fIdx];
            this.splits[fIdx]=BayesSplit.fromJSON(splitJSON);
        }
    }
}