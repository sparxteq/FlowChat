import { DivUI } from "../../../../Zing3/zui/DivUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { NameString } from "../../common/NameString";
import { ZArray, ZBoolean, ZDict, ZField, ZFileName, ZNumber, ZString, ZT } from "../../common/ZT";



export class ZTValueView extends ZUI{
    type:ZT
    data:any
    constructor(type:ZT,data:any){
        super();
        this.type=type;
        this.data=data;
        this.content = this.pickView(this.data)
    }
    private pickView(data:any):ZUI{
        return this.pickTypeView(this.type,data);
    }
    private viewZDict(dict:ZDict,data:any):ZUI{
        let fieldZUIs:ZUI[]=[];
        for (let fieldName of dict.fieldNames()){
            let field = dict.getField(fieldName);
            if (field){
                let uName = NameString.toCapSpaced(field.fieldName);
                let fView = this.fieldView(fieldName,uName,field,data[fieldName]);
                fieldZUIs.push(fView)
            }
        }
        return new DivUI(fieldZUIs).style("FlowView-dict")
    }
    private fieldView(fieldName:string,userName:string,field:ZField,data:any):ZUI{
        if (field.type.typeName()=="ZDict"){
            return this.dictFieldView(fieldName,userName,field,data);
        }
        if (field.type.typeName()=="ZArray"){
            return this.arrayFieldView(fieldName,userName,field,data)
        }
        let nameCol=field.type.strToCol(fieldName);
        let valCol=1;
        return new DivUI([
            new TextUI(userName+":").style(`col-${12-valCol} FlowView-fieldLabel`),
            new ZTValueView(field.type,data).style(`col-${valCol} FlowView-fieldValue`)
        ]).style(`col-${valCol+nameCol}`)
    }
    private dictFieldView(fieldName:string,userName:string,field:ZField,data:any):ZUI{
        let label = new TextUI(userName).style("col-12");
        let ft = field.type;
        let dictZUI = this.viewZDict(<ZDict>ft,data)
        return new DivUI([label,dictZUI]).style("col-12")
    }
    private arrayFieldView(fieldName:string,userName:string,field:ZField,data:any):ZUI{
        let label = new TextUI(userName).style("col-12");
        let ft = field.type;
        let arrayZUI = this.viewZArray(<ZArray>ft,data)
        return new DivUI([label,arrayZUI]).style("col-12")
    }
    private viewZNumber(type:ZNumber,data:number):ZUI{
        //return new TextUI("viewZNumber")
        let decimals = type.info.decimals;
        if (!decimals)
            decimals=0;
        let digits = 10+decimals;
        let col = Math.floor(digits/8)+1;
        return new TextUI(data.toLocaleString()).style(`col-${col}`)
    }
    private viewZString(type:ZString,data:string):ZUI{
        let col = Math.floor(data.length/16)+1;
        return new TextUI(data).style(`col-${col} FlowView-fieldValue`)
    }
    private viewZFileName(type:ZFileName,data:any):ZUI{
        let col = Math.floor(data.length/16)+1;
        return new TextUI(data).style(`col-${col} FlowView-fieldValue`)
    }
    private viewZBoolean(type:ZBoolean,data:any):ZUI{
        let col = 1;
        let b = <boolean>data;
        let s="";
        if (b)
            s="X";
        return new DivUI([new TextUI(s).style("ViewBoolean-check")]).style(`col-${col}`)
    }
    private viewZArray(type:ZArray,data:any[]):ZUI{
        let arrayZUIs:ZUI[]=[];
        let elType = type.getElementType()
        for (let idx in data){
            let v = data[idx];
            let tv = this.pickTypeView(elType,v);
            arrayZUIs.push(tv);
        }
        return new DivUI(arrayZUIs).style("FlowView-array");
    }
    protected viewZAny(data:any):ZUI{
        let tn = this.dataToType(data);
        let v = this.pickTypeView(tn,data);
        return v;
    }
    protected viewZAlternative(data:any):ZUI{
        let tn = this.dataToType(data);
        let v = this.pickTypeView(tn,data);
        return v;
    }
    private dataToType(data:any):ZT{
        let to = typeof data;
        switch(to){
            case "number":
                return new ZNumber();
            case "string":
                return new ZString();
            case "boolean":
                return new ZBoolean();
            case "object":
                if (data.isArray()){
                    let elType=this.dataToType(data[0])
                    return new ZArray(elType)
                }else
                    return new ZDict()
            default:
                return new ZString()
        }
    }
    private viewZCode(data:any):ZUI{
        return new TextUI(data);
    }
    protected pickTypeView(type:ZT,data:any):ZUI{
        let typeName=type.typeName();
        switch(typeName){
            case "ZDict":
                return this.viewZDict(<ZDict>type,data)
            case "ZNumber":
                return this.viewZNumber(<ZNumber>type,data)
            case "ZArray":
                return this.viewZArray(<ZArray>type,data);
            case "ZString":
                return this.viewZString(<ZString>type,data)
            case "ZFileName":
                return this.viewZFileName(<ZFileName>type,data)
            case "ZBoolean":
                return this.viewZBoolean(<ZBoolean>type,data);
            case "ZAny":
                return this.viewZAny(data);
            case "ZCode":
                return this.viewZCode(data);
            case "ZAlternative":
                return this.viewZAlternative(data)
            default:
                return new TextUI(`default view of "${typeName}"`)
        }
    }
}