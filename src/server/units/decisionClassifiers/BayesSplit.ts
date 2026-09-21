


export class BayesSplit{
    private splits:BayesSplitValues=[];
    private bToA=0;
    private decisionValue=0
    private nA=0;
    train(aValues:number[],bValues:number[]){
        this.bToA = aValues.length/bValues.length;
        this.nA = aValues.length;
        let sortedOutcomes = this.sortOutcomes(aValues,bValues);
        let runEncoded = this.encodeRuns(sortedOutcomes);
        if (runEncoded.length==1){
            this.splits=[
                {minValue:Number.MAX_SAFE_INTEGER,maxValue:Number.MAX_SAFE_INTEGER,nA:0,nB:0}
            ]
            this.decisionValue=0;
            return;
        } else if (runEncoded.length==2){
            if (this.pureRuns(runEncoded))
                this.pureBinarySplit(runEncoded)
            else
                this.mixedBinarySplit(runEncoded)
        } else {
            this.splits=[
                {minValue:0,maxValue:0,nA:0,nB:0},
                {minValue:Number.MAX_SAFE_INTEGER,maxValue:Number.MAX_SAFE_INTEGER,nA:0,nB:0}
            ]
            this.findBinarySplit(runEncoded);
            this.computeDecisionValue();
        }
    }
    decide(v:number):{outcome:"A"|"B",confidence:number}{
        for (let splitIdx=0;splitIdx<this.splits.length;splitIdx++){
            let split=this.splits[splitIdx];
            if (v<split.maxValue){
                let outcome:"A"|"B"="A";
                let confidence = this.confidence(splitIdx);
                if (split.nA<split.nB)
                    outcome="B";
                return {outcome:outcome,confidence:confidence}
            }
        }
        return {outcome:"A",confidence:0}
    }
    private pureRuns(runs:BayesSplitValues):boolean{
        for (let run of runs){
            if (run.nA>0 && run.nB>0)
                return false;
        }
        return true;
    }
    private computeDecisionValue(){
        let confSum=0;
        for (let i=0;i<this.splits.length;i++){
            let conf = this.confidence(i);
            let wConf = conf*(this.splits[i].nA+this.splits[i].nB)
            confSum+=wConf;
        }
        this.decisionValue = (confSum)/(2*this.nA);
    }
    private confidence(idx:number):number{
        let split = this.splits[idx];
        let conf = Math.abs(split.nA-split.nB)/(split.nA+split.nB);
        return conf;
    }
    private pureBinarySplit(runEncoded:BayesSplitValues){
        let gapMin = runEncoded[0].maxValue;
        let gapMax = runEncoded[1].minValue;
        let split = (gapMin+gapMax)/2
        let min = runEncoded[0].minValue;
        let max = runEncoded[1].maxValue;
        this.decisionValue = (gapMax-gapMin)/(max-min)+1;
        let nA=1;
        let nB=1;
        if (runEncoded[0].nA>0)
            nB=0;
        else
            nA=0;
        this.splits = [
            {minValue:0,maxValue:split,nA:nA,nB:nB},
            {minValue:Number.MAX_SAFE_INTEGER,maxValue:Number.MAX_SAFE_INTEGER,nA:nB,nB:nA}
        ]
    }
    private mixedBinarySplit(runEncoded:BayesSplitValues){
        let gapMin = runEncoded[0].maxValue;
        let gapMax = runEncoded[1].minValue;
        let split = (gapMin+gapMax)/2
        this.splits = [
            {minValue:0,maxValue:split,nA:runEncoded[0].nA,nB:runEncoded[0].nB},
            {minValue:runEncoded[1].minValue,maxValue:Number.MAX_SAFE_INTEGER
                ,nA:runEncoded[1].nA,nB:runEncoded[1].nB}
        ]
        this.computeDecisionValue();
    }
    
    private sortOutcomes(aValues:number[],bValues:number[]):BayesSplitValues{
        let rslt:BayesSplitValues=[];
        for (let a of aValues){
            rslt.push({minValue:a,maxValue:a,nA:1,nB:0})
        }
        for (let b of bValues){
            rslt.push({minValue:b,maxValue:b,nA:0,nB:this.bToA})
        }
        rslt.sort((a,b)=>{
            return a.maxValue-b.maxValue
        })
        return rslt;
    }
    private encodeRuns(values:BayesSplitValues):BayesSplitValues{
        let last={minValue:values[0].minValue,maxValue:0,nA:0,nB:0};
        let rslt:BayesSplitValues=[];
        for (let v of values){
            if (v.maxValue==last.maxValue){
                last.nA+=v.nA;
                last.nB+=v.nB;
            } else if (v.nA>0){
                if (last.nB==0){
                    last.maxValue=v.maxValue;
                    last.nA+=v.nA
                }else {
                    rslt.push(last);
                    last=v;
                }
            } else {
                if (last.nA==0){
                    last.maxValue=v.maxValue;
                    last.nB+=v.nB
                } else {
                    rslt.push(last);
                    last=v;
                }
            }
        }
        if (last.nA>0 || last.nB>0)
            rslt.push(last);
        return rslt;
    }
    private findBinarySplit(runs:BayesSplitValues){
        let maxDV = -1;
        let maxDVSplitIdx = -1;
        let maxALower=0;
        let maxBLower=0;
        let nAUpper = 0;
        let nBUpper = 0;
        let nALower = 0;
        let nBLower = 0;
        for (let i=0;i<runs.length;i++){
            let run = runs[i];
            nAUpper+=run.nA;
            nBUpper+=run.nB;
        }
        let nA=nAUpper;
        let nB=nBUpper;
        for (let i=0;i<runs.length-1;i++){
            let run = runs[i];
            nALower+=run.nA;
            nAUpper-=run.nA;
            nBLower+=run.nB;
            nBUpper-=run.nB;
            let confLower = Math.abs(nALower-nBLower)/(nALower+nBLower);
            let confUpper = Math.abs(nAUpper-nBUpper)/(nAUpper+nBUpper);
            let dv = (confLower*(nALower+nBLower)+confUpper*(nAUpper+nBUpper))
                /(nALower+nBLower+nAUpper+nBUpper)
            if (dv>=maxDV){
                maxDV=dv;
                maxDVSplitIdx=i;
                maxALower=nALower;
                maxBLower=nBLower;
            }
        }
        if (maxDVSplitIdx<0){
            maxDVSplitIdx=0;
            maxALower=runs[0].nA;
            maxBLower=runs[0].nB;
        } 

        let gapMin = runs[maxDVSplitIdx].maxValue;
        let gapMax = runs[maxDVSplitIdx+1].minValue;
        let split = (gapMin+gapMax)/2;
        this.splits = [
            {minValue:0,maxValue:split,nA:maxALower,nB:maxBLower},
            {minValue:split,maxValue:Number.MAX_SAFE_INTEGER
                ,nA:nA-maxALower,nB:nB-maxBLower}
        ]
        this.computeDecisionValue();
    }
    toJSON():any{
        return {
            decisionValue:this.decisionValue,
            splits:this.splits
        }
    }
    static fromJSON(json:any):BayesSplit{
        let split = new BayesSplit();
        split.splits=json.splits;
        split.decisionValue = json.decisionValue;
        return split;
    }
}
type BayesSplitValues = { 
    minValue:number,    // minimum feature value for this split
    maxValue:number,    // maximum feature value for this split
    nA:number,          // number of values with outcome A
    nB:number,           // number of values with outcome B weighted by totalA/totalB
    runIdx?:number
}[]