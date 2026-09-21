import { DecisionClassifier, DecisionTrainingItem } from "./DecisionClassifier";
import { DecisionTrainingData } from "./DecisionTrainingData";



export class DecisionDVVote extends DecisionClassifier{
    
    algorithmId(): string {
        return "DVVote";
    }
    featuresToUse:{ featureIdx: number; decisionValue: number; }[]=[]
    private trained:DVVoteTrainedFeature[]=[]
    private aOutcome:string=""
    private bOutcome:string=""
    train(trainingData: DecisionTrainingData, decision: string
        , examplesToUse: number[]
        , featuresToUse: { featureIdx: number; decisionValue: number; }[]): void {
        this.trainingData=trainingData;
        this.decision=decision;
        this.featuresToUse=featuresToUse;
        let {aEx,bEx} = this.splitAB(decision,examplesToUse);
        let [a,b]=decision.split(" | ");
        this.aOutcome=a;
        this.bOutcome=b;
        this.trained=[]
        for (let feature of featuresToUse){
            let tf = this.trainFeature(feature,aEx,this.aOutcome,bEx,this.bOutcome)
            this.trained.push(tf)
        }
    }
    eval(featureVals: number[]): { outcome: string; confidence: number; } {
        let aSum=0;
        let bSum=0;
        for (let i=0;i<this.trained.length;i++){
            let item = this.trained[i];
            let value = featureVals[i];
            if (value<item.splitVal){
                if (item.aIsLow)
                    aSum+=item.decisionVal
                else
                    bSum+=item.decisionVal
            } else {
                if (item.aIsLow)
                    bSum+=item.decisionVal
                else
                    aSum+=item.decisionVal;
            }
        } 
        let confidence = 2*aSum/(aSum+bSum)-1
        let outcome = this.aOutcome;
        if (aSum<bSum){
            confidence = 2*bSum/(aSum+bSum)-1
            outcome = this.bOutcome
        }
        return {outcome:outcome,confidence:confidence}
    }
    private trainFeature(feature:{featureIdx:number,decisionValue:number}
        ,aEx:number[],aOutcome:string,bEx:number[],bOutcome:string):DVVoteTrainedFeature{
        
        let rslt:DVVoteTrainedFeature = {featureIdx:feature.featureIdx
            ,splitVal:-1,aIsLow:false
            ,decisionVal:feature.decisionValue}
        if (!this.trainingData)
            return rslt;
        let items:DecisionTrainingItem[]=[];
        let aMax=-1;
        let aMin= Number.MAX_SAFE_INTEGER;
        for (let ex of aEx){
            let value = this.trainingData.examples[ex].vals[feature.featureIdx]
            let item:DecisionTrainingItem = {
                outcome:aOutcome,
                value:value
            }
            if (value>aMax)
                aMax=value
            if (value<aMin)
                aMin=value;
            items.push(item);
        }
        let bMax=-1;
        let bMin= Number.MAX_SAFE_INTEGER;
        for (let ex of bEx){
            let value = this.trainingData.examples[ex].vals[feature.featureIdx]
            let item:DecisionTrainingItem = {
                outcome:bOutcome,
                value:value
            }
            if (value>bMax)
                bMax=value
            if (value<bMin)
                bMin=value;
            items.push(item);
        }
        if (aMin<bMin){
            rslt.splitVal = (aMax+bMin)/2
            rslt.aIsLow=true;
        } else {
            rslt.splitVal = (bMax+aMin)/2
            rslt.aIsLow=false;
        }
        return rslt;
    }
    protected subToJSON(json: any) {
        json.trained = this.trained;
        json.aOutcome = this.aOutcome;
        json.bOutcome = this.bOutcome;
        return json;
    }
    fromJSON(json: any): void {
        this.trained=json.trained;
        this.aOutcome = json.aOutcome;
        this.bOutcome = json.bOutcome;
    }
    
}
type DVVoteTrainedFeature = {
    featureIdx:number,
    aIsLow:boolean,
    splitVal:number,
    decisionVal:number
}