import { DB } from "../../../../Zing3/share/DB";
import { ButtonUI } from "../../../../Zing3/zui/ButtonUI";
import { DivUI } from "../../../../Zing3/zui/DivUI";
import { DropDownChoiceUI } from "../../../../Zing3/zui/DropDownChoiceUI";
import { StyleCheckUI } from "../../../../Zing3/zui/StyleCheckUI";
import { TextFieldUI } from "../../../../Zing3/zui/TextFieldUI";
import { TextUI } from "../../../../Zing3/zui/TextUI";
import { ZUI } from "../../../../Zing3/zui/ZUI";
import { NameString } from "../../common/NameString";
import { ZArray, ZBoolean, ZCode, ZDict, ZField, ZFileName, ZJSONInfo, ZNumber, ZString, ZT } from "../../common/ZT";
import { ZTValueView } from "./ZTValueView";
import { ViewFileTreeRoot } from "./tree/ViewFileTreeRoot"



export class ZTValueEdit extends ZTValueView{
    allChangeNotify:()=>void
    projectId:string;
    actPath:string;
    email:string;
    constructor(type:ZT,data:any,changeNotify:(data:any)=>void,projectId:string,actPath:string,email:string){
        super(type,data);
        this.type=type;
        this.data=data;
        this.projectId=projectId;
        this.actPath=actPath;
        this.email=email;
        this.allChangeNotify=()=>{ changeNotify(data) };
        this.content=this.pickEdit(this.data)
    }
    reload(){
        this.content=this.pickEdit(this.data)
        ZUI.notify();
    }
    private pickEdit(data:any):ZUI{
        return this.pickTypeEdit(this.type,data);
    }
    private editZDict(dict:ZDict,data:any,sub?:string,info?:ZJSONInfo):ZUI{
        let fieldZUIs:ZUI[]=[];
        for (let fieldName of dict.fieldNames()){
            let field = dict.getField(fieldName);
            if (field){
                let uName = NameString.toCapSpaced(field.fieldName);
                let info = field.info;
                let fView = this.fieldEdit(fieldName,uName,field,info,data);
                fieldZUIs.push(fView)
            }
        }
        return new DivUI(fieldZUIs).style("ZT-dict")
    }
    private fieldEdit(fieldName:string,userName:string,field:ZField,info:ZJSONInfo,container:any):ZUI{
        if (field.type.typeName()=="ZDict"){
            return this.dictFieldEdit(fieldName,userName,field,container);
        }
        if (field.type.typeName()=="ZArray"){
            return this.arrayFieldEdit(fieldName,userName,field,container)
        }
        let nameCol=field.type.strToCol(fieldName);
        let valCol = 1;
        return new DivUI([
            new TextUI(userName+":").style(`ZT-fieldLabel`),
            this.pickTypeEdit(field.type,container,fieldName,info).style(`ZT-fieldValue`)
        ])
        //.style("col-4");
    }
    private dictFieldEdit(fieldName:string,userName:string,field:ZField,container:{[id:string]:any}):ZUI{
        let label = new TextUI(userName).style("ZT-fieldLabel");
        let ft = field.type;
        let dictZUI = this.editZDict(<ZDict>ft,container,fieldName)
        return new DivUI([label,dictZUI])//.style("col-12")
    }
    private arrayFieldEdit(fieldName:string,userName:string,field:ZField,container:{[id:string]:any}):ZUI{
        let label = new TextUI(userName).style("col-12");
        let ft = field.type;
        let arrayZUI = this.editZArray(<ZArray>ft,container,fieldName).style("ZT-array")
        let elType = (<ZArray>ft).getElementType();
        if (elType instanceof ZFileName){
            return new DivUI([label,arrayZUI]).style("col-4")
        }
        return new DivUI([label,arrayZUI]).style("col-12")
    }
    private editZNumber(type:ZNumber,container:{[id:string]:any},sub?:string,info?:ZJSONInfo):ZUI{
        let decimals = type.info.decimals;
        if (!decimals){
            if (info){
                decimals=info.decimals;
                if (!decimals)
                    decimals=0;
            } else {
                decimals=0;
            }
        } else
            decimals=0;
        let step = 1;
        for (let i=0;i<decimals;i++){
            step*=10;
        }
        step = 1/step;
        let edit = new TextFieldUI("number")
            .incrementStep(step)
            .getF(()=>{
                if (!decimals && decimals !=0)
                    if(sub)
                        return container[sub].toString();
                if (sub)
                    return container[sub].toFixed(decimals)
            })
            .setF((str:string)=>{
                let n = Number.parseFloat(str);
                if (sub){
                    if (isNaN(n))
                        n=container[sub]
                    container[sub]=n;
                    this.allChangeNotify();
                }
            }).style("ZT-fieldValue")
        return edit;
    }
    private editZString(type:ZString,container:{[id:string]:any},sub?:string,info?:ZJSONInfo):ZUI{
        let edit = new TextFieldUI("text")
            .getF(()=>{
                if (sub)
                    return container[sub].toString();
            })
            .setF((str:string)=>{
                if (sub){
                    container[sub]=str;
                    this.allChangeNotify();
                }
            }).style("ZT-fieldValue")
            return edit;
    }
   
    private editZFileName(type:ZFileName,container:{[id:string]:any},sub?:string,info?:ZJSONInfo):ZUI{
        let selections=[]
        if (sub)
            selections = container[sub]
        let vet = new ViewFileTreeRoot(this.email,this.actPath,this.projectId
            ,selections
            ,(path:string,selected:boolean)=>{
                //DB.msg(`edit select ${path} - ${selected}`);
                if (vet && !selected)
                    vet.selectContentViews(false);
                let selections = vet.collectSelections("")
                if (selections.length>0){
                    if (sub)
                        container[sub]=selections[0]
                } else {
                    if (sub)
                        container[sub]="";
                }
                this.allChangeNotify();
            },()=>{
                //DB.start("ValueTypeEdit.editZFileName reload")
                this.reload();
                //DB.end()
            },false)
        let text = new TextUI(()=>{
            if (sub)
                return container[sub]
            else
                return ""
        }).style("col-12")
        return new DivUI([text,vet]);
    }
        
    private editZBoolean(type:ZBoolean,container:{[id:string]:any},sub?:string,info?:ZJSONInfo):ZUI{
        let edit = new StyleCheckUI(()=>{
            if (sub)
                return container[sub]
            else
                return container;
        }).click(()=>{
            if (sub)
                container[sub]=!container[sub];
            this.allChangeNotify();
        }).style("ZT-fieldValue")
        return edit;
    }
    private editZCode(type:ZCode,container:{[id:string]:any},sub?:string,info?:ZJSONInfo):ZUI{
        let edit = new DropDownChoiceUI()
                        .setF((s:string)=>{
                            if (sub && s!="--")
                                container[sub]=s;
                            this.allChangeNotify()
                        }).getF(()=>{
                            return container[<string>sub]
                        })
                        .choice("--","--");
        let len=2;
        let vals = type.codeVals()
        for (let val of vals){
            if (typeof val == "number"){
                val = val.toString();
            }
            edit.choice(val,val);
            if (val.length>len)
                len=val.length;
        }
        let col=Math.floor(len/8)+5;
        return edit.style(`ZT-fieldValue`);
    }
    
    private editZFileMultiChoice(type:ZFileName,container:{[id:string]:any},sub?:string,info?:ZJSONInfo):ZUI{
        let selections=[""]
        if (sub)
            selections = container[sub]
        let vet = new ViewFileTreeRoot(this.email,this.actPath,this.projectId,selections
            ,(path:string,selected:boolean)=>{
                //DB.msg(`edit select multi ${path} - ${selected}`);
                let selections = vet.collectSelections("")
                if (sub)
                    container[sub]=selections;
                else{
                    container=selections;
                }
                this.allChangeNotify();
                //DB.msg("      selections",selections)
            },()=>{
                //DB.start("ValueTypeEdit.editZFileMultiChoice reload")

                this.reload();
                //DB.end()
            },true)
        let text = new TextUI(()=>{
            let sel:string[]=[]
            if (sub)
                sel = container[sub]
            else
                sel = <string[]>container;
            if (sel.length>0){
                return `[... ${sel.length} ...]`
            }
            return "[--]"
        }).style("ZT-fieldValue")
        let exts:string[]=[];
        if (info && info.extensions){
            exts=info.extensions;
        }
        let path="";
        if (info && info.path){
            path = info.path;
        }
        return new DivUI([text,vet]);
    }

    private editZArray(type:ZArray,container:any,sub?:string,info?:ZJSONInfo):ZUI{
        let arrayZUIs:ZUI[]=[];
        let elType=type.getElementType();
        if (elType instanceof ZFileName){
            return this.editZFileMultiChoice(elType,container,sub,info)
        }
        let elTypeName = elType.typeName();
        let data = container;
        if (sub)
            data = container[sub];
        for (let idx in data){
            let i = Number.parseInt(idx);
            let tv = this.arrayElementEdit(elType,data,i);
            arrayZUIs.push(tv);
        }
        let addBtn = new ButtonUI("+").click(()=>{
            //DB.start("ValueTypeEdit.editZArray reload")
            let el = elType.default();
            data.push(el);
            this.reload();
            this.allChangeNotify()
            //DB.end()
        }).style("ZT-addRemButton")
        arrayZUIs.push(addBtn);
        return new DivUI(arrayZUIs).style("ZT-array");
    }   
        private arrayElementEdit(elType:ZT,array:any[],idx:number):ZUI{
            let delBtn = new ButtonUI("-").click(()=>{
                array.splice(idx,1)
                this.reload();
                this.allChangeNotify();
            }).style("ZT-addRemButton")
            let edit = this.pickTypeEdit(elType,array,idx.toString())
            let combine = new DivUI([delBtn,edit])
            return combine;
        }
    protected pickTypeEdit(type:ZT,container:any,sub?:string,info?:ZJSONInfo):ZUI{
        let typeName = type.typeName();
        switch(typeName){
            case "ZDict":
                return this.editZDict(<ZDict>type,container,sub,info)
            case "ZNumber":
                return this.editZNumber(<ZNumber>type,container,sub,info)
            case "ZArray":
                return this.editZArray(<ZArray>type,container,sub,info);
            case "ZString":
                return this.editZString(<ZString>type,container,sub,info)
            case "ZFileName":
                return this.editZFileName(<ZFileName>type,container,sub,info)
            case "ZBoolean":
                return this.editZBoolean(<ZBoolean>type,container,sub,info);
            case "ZAny":
                if (sub)
                    return this.viewZAny(container[sub]);
                else
                    return this.viewZAny(container);
            case "ZCode":
                return this.editZCode(<ZCode>type,container,sub,info);
            case "ZAlternative":
                return this.viewZAlternative(container[<string>sub])
            default:
                return new TextUI(`default view of "${typeName}"`)
        }
    }
}