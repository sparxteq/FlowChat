import { DecisionTrainingData } from "./DecisionTrainingData";


export abstract class DecisionClassifier {

    abstract algorithmId():string;
    decision:string="";
    trainingData?:DecisionTrainingData

    abstract train(trainingData:DecisionTrainingData
            ,decision:string
            ,examplesToUse:number[]
            ,featuresToUse:{featureIdx:number, decisionValue:number}[]):void;
    abstract eval(featureVals:number[]):{outcome:string,confidence:number};
    toJSON():any{
        let rslt:any={
            algorithmId:this.algorithmId()
        }
        return this.subToJSON(rslt)
    }
    protected abstract subToJSON(json:any):any;
    abstract fromJSON(json:any):void;
    protected splitAB(decision:string,examplesToUse:number[]):{aEx:number[],bEx:number[]}{
        if (!this.trainingData)
            return {aEx:[],bEx:[]}
        let aEx:number[]=[];
        let bEx:number[]=[];
        let [aOutcome,bOutcome]=decision.split(" | ");
        for (let exIdx of examplesToUse){
            let ex = this.trainingData.examples[exIdx];
            let outcome = ex.outcome;
            if (aOutcome==outcome)
                aEx.push(exIdx)
            else if (bOutcome==outcome || bOutcome=="*"){
                bEx.push(exIdx)
            }
        }
        return {aEx:aEx,bEx:bEx}
    }
}
export type DecisionTrainingItem = {
    outcome:string,
    value:number
}