import { classifierRegister } from "./classifierMake";
import { DecisionBayes } from "./DecisionBayes";
import { DecisionClassifier } from "./DecisionClassifier";
import { DecisionDVVote } from "./DecisionDVVote";
import { DecisionNearestNeighbor } from "./DecisionNearestNeighbor";



export function classifierInit(){
    classifierRegister('DVVote',():DecisionClassifier=>{
        return new DecisionDVVote();
    })
    classifierRegister("NNeighbor",():DecisionClassifier=>{
        return new DecisionNearestNeighbor()
    })
    classifierRegister("Bayes",():DecisionClassifier=>{
        return new DecisionBayes()
    })
}