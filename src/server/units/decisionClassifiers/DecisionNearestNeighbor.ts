import { DecisionClassifier } from "./DecisionClassifier";
import { DecisionTrainingData } from "./DecisionTrainingData";



export class DecisionNearestNeighbor extends DecisionClassifier{
    algorithmId(): string {
        return "NNeighbor"
    }
    private trainedFeatures:NNTrainedFeature[]=[]
    private aOutcome="";
    private bOutcome="";
    train(trainingData: DecisionTrainingData, decision: string
        , examplesToUse: number[]
        , featuresToUse: { featureIdx: number; decisionValue: number; }[]): void {

        this.trainingData=trainingData;
        this.decision=decision;
        let [aOutcome,bOutcome]=decision.split(" | ")
        this.aOutcome=aOutcome;
        this.bOutcome=bOutcome;
        for (let f of featuresToUse){
            let trainedFeature = this.trainAFeature(f,examplesToUse);
            this.trainedFeatures.push(trainedFeature)
        }
    }
    eval(featureVals: number[]): { outcome: string; confidence: number; } {
        let aSum=0;
        let bSum=0;
        for (let fIdx=0;fIdx<featureVals.length;fIdx++){
            let {outcome,confidence} = this.evalFeature(featureVals[fIdx]
                ,this.trainedFeatures[fIdx].nnItems)
            if (outcome=this.aOutcome){
                aSum+=confidence;
            } else {
                bSum+=confidence;
            }
        }
        let diff = aSum-bSum;
        if (diff<0){
            diff = -diff/featureVals.length;
            return {outcome:this.bOutcome,confidence:diff}
        } else {
            diff = diff/featureVals.length;
            return {outcome:this.aOutcome,confidence:diff}
        }
    }

    private trainAFeature(f:{ featureIdx: number; decisionValue: number; }
        ,examplesToUse:number[]):NNTrainedFeature{

        if (!this.trainingData)
            return {nnItems:[]}
        let items:NNTrainingItem[]=[]
        for (let exI of examplesToUse){
            let ex = this.trainingData.examples[exI]
            let item:NNTrainingItem={
                exId:ex.id,
                outcome:ex.outcome,
                value:ex.vals[f.featureIdx]
            }
            if (!item.value)
                item.value=0;
            items.push(item);
        }
        /*items.sort((a,b)=>{
            let outcomeCompare = a.outcome.localeCompare(b.outcome);
            if (outcomeCompare==0)
                return a.value-b.value;
            else
                return outcomeCompare;
        })
        debugger;*/
        items.sort((a,b)=>{
            return a.value-b.value
        })
        let ennItems = this.editNN(items);
        let cnnItems = this.clusterNN(ennItems);
        return {nnItems:cnnItems}
    }
    private editNN(items:NNTrainingItem[]):NNTrainingItem[]{
        let rslt:NNTrainingItem[]=[items[0],items[1]]
        let l = items.length-2;
        for (let i=2;i<l;i++){
            let {outcome,confidence}=this.nnEditVote(i,items);
            if(outcome==items[i].outcome ){
                rslt.push(items[i])
            }
        }
        rslt.push(items[l])
        rslt.push(items[l+1])
        return rslt;
    }
    private nnEditVote(i:number,items:NNTrainingItem[]):{outcome:string,confidence:number}{
        let aVote=0;
        let bVote=0;
        let v = items[i].value;
        let d = this.d(v,items[i-2].value)
        if (items[i-2].outcome==this.aOutcome){
            aVote += d
        } else {
            bVote += d;
        }
        d = this.d(v,items[i-1].value)
        if (items[i-1].outcome==this.aOutcome){
            aVote += d
        } else {
            bVote += d;
        }
        d = this.d(v,items[i+1].value)
        if (items[i+1].outcome==this.aOutcome){
            aVote += d
        } else {
            bVote += d;
        }
        d = this.d(v,items[i+2].value)
        if (items[i+2].outcome==this.aOutcome){
            aVote += d
        } else {
            bVote += d;
        }
        if (aVote>bVote){
            return {outcome:this.aOutcome,confidence:2*aVote/(aVote+bVote)-1}
        } else {
            return {outcome:this.bOutcome,confidence:2*bVote/(aVote+bVote)-1}
        }
    }
    private d(a:number,b:number):number{
        let d = a-b
        if (d<0) d=-d;
        let r = 1/(d+0.000000001)
        return r
    }
    private clusterNN(items:NNTrainingItem[]):NNTrainingItem[]{
        let done = false;
        let itemsUsed:{[exId:string]:boolean}={}
        let trainedItems:NNTrainingItem[]=[items[0],items[items.length-1]];
        while (!done){
            done = true;
            for (let item of items){
                if (!itemsUsed[item.exId]){
                    let outcome = this.evalFeature(item.value,trainedItems).outcome
                    if (outcome!=item.outcome){
                        itemsUsed[item.exId]=true;
                        trainedItems.push(item)
                        trainedItems.sort((a,b)=>{
                            return a.value-b.value
                        })
                        done=false;
                    }
                }
            }
        }
        return trainedItems;
    }
    private evalFeature(value:number,tItems:NNTrainingItem[]):{outcome:string,confidence:number}{
        let aOutcome = tItems[0].outcome;
        let bOutcome = "";
        for (let i =0;i<tItems.length-1;i++){
            let item = tItems[i]
            let next = tItems[i+1]
            if (item.outcome !=aOutcome){
                bOutcome=item.outcome;
                break;
            }
            if (item.value<=value && next.value>value){
                let ltDist = value-item.value;
                let gtDist = next.value-value;
                let ave = (item.value+next.value)/2;
                let aDist = ave-item.value;
                if (item.outcome==next.outcome){
                    return {outcome:item.outcome,confidence:1}
                } else if (ltDist<gtDist) { // closer to item
                    let conf = 1-ltDist/aDist
                    return {outcome:item.outcome,confidence:conf}
                } else {
                    let conf = 1-gtDist/aDist;
                    return {outcome:next.outcome,confidence:conf}
                }
            }
        }
        return {outcome:tItems[tItems.length-1].outcome,confidence:1}
        /*let aMinDist = Number.MAX_VALUE;
        let bMinDist = Number.MAX_VALUE;
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;
        for (let item of tItems){
            let d = item.value-value;
            if (d<0)d = -1;
            if (item.outcome==aOutcome){
                if (aMinDist>d)
                    aMinDist=d;
            } else {
                if (bMinDist>d)
                    bMinDist=d;
            }
            if (item.value<min)
                min = item.value;
            if (item.value>max)
                max = item.value;
        }
        let range = max-min;
        aMinDist/=range;
        bMinDist/=range;
        let conf = 1-()
        if (aMinDist<bMinDist){
            conf
        }
        let vIdx = this.valueIndex(value,tItems);
        let votes:NNVote[]=[];
        for ( let n =vIdx-1;n<=vIdx+2;n++){
            if (n>=0 && n<tItems.length){
                let o=tItems[n].outcome;
                let d = this.d(value,tItems[n].value);
                votes.push({outcome:o,d:d})
            }
        }
        let aSum=0;
        let bSum=0;
        for (let vote of votes){
            if (vote.outcome == this.aOutcome){
                aSum+=vote.d;
            } else {
                bSum+=vote.d;
            }
        }
        if (aSum>bSum){
            let c = 2*aSum/(aSum+bSum)-1;
            return {outcome:this.aOutcome,confidence:c}
        } else {
            let c = 2*bSum/(aSum+bSum)-1;
            return {outcome:this.bOutcome,confidence:c}
        }*/
    }
    private valueIndex(value:number,tItems:NNTrainingItem[]):number{
        for (let i=0;i<tItems.length-1;i++){
            if (tItems[i].value<=value && tItems[i+1].value>=value)
                return i;
        }
        return tItems.length-1;
    }
    protected subToJSON(json: any) {
        json.trainedFeatures = this.trainedFeatures;
        json.aOutcome = this.aOutcome;
        json.bOutcome = this.bOutcome;
        return json
    }
    fromJSON(json: any): void {
        this.trainedFeatures=json.trainedFeatures;
        this.aOutcome = json.aOutcome;
        this.bOutcome = json.bOutcome;
    }
    
}
type NNTrainedFeature = {
    nnItems:NNTrainingItem[]
}
type NNTrainingItem = {
    exId:string,
    outcome:string,
    value:number
}
type NNVote = {
    outcome:string,
    d:number
}