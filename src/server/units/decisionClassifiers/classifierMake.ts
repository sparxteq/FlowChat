import { DecisionClassifier } from "./DecisionClassifier";

var registry:{[algorithmId:string]:(id:string)=>DecisionClassifier}={};

export function classifierMake(algorithmId:string,classifierDecision:string):DecisionClassifier{
    let factory = registry[algorithmId]
    if (!factory)
        throw `classifier algorithm "${algorithmId}" is not registered. Did you call classifierInit()`
    return factory(classifierDecision)
}
export function classifierRegister(algorithmId:string,make:()=>DecisionClassifier){
    registry[algorithmId]=make;
}
export function fromJSON(json:any):DecisionClassifier{
    let algorithmId = json.algorithmId;
    let decision = json.decision;
    let rslt = classifierMake(algorithmId,decision);
    rslt.fromJSON(json);
    return rslt;
}