import { DB } from "../../../../Zing3/share/DB";
import { TypeJSON } from "../../common/workbookJSON";



export class TypeS{
    typeName:string="";
    superTypes:TypeS[]=[];
    description:string="";
    constructor (typeName:string,superTypes:string[],description:string){
        this.typeName=typeName;
        this.description=description;
        this.superTypes=[];
        for (let stName of superTypes){
            let st = TypeS.getType(stName);
            if (!st){
                DB.msg(`supertype ${stName} of ${typeName} not yet registered`)
            }
            this.superTypes.push(st);
        }
        TypeS.register(this)
    }
    static uploadJSON():TypeJSON[]{
        let rslt:TypeJSON[]=[];
        for (let t of this.typeList){
            let json = t.toTypeJSON()
            rslt.push(json);
        }
        return rslt;
    }
    private toTypeJSON():TypeJSON{
        let stNames:string[]=[];
        for (let st of this.superTypes){
            let name = st.typeName;
            stNames.push(name);
        }
        let rslt:TypeJSON = {
            typeName:this.typeName,
            description:this.description,
            superTypes:stNames
        }
        return rslt;
    }
    static registry:{[typeName:string]:TypeS}={};
    static typeList:TypeS[]=[];
    protected static register(typeS:TypeS){
        let tn = typeS.typeName;
        this.registry[tn]=typeS;
        this.typeList.push(typeS);
    }
    static getType(typeName:string):TypeS{
        return this.registry[typeName]
    }
}