
import { fileExtension, validExtension } from "./files/ext";



export abstract class ZT {
    toJSON():any{
        let t = this.typeName();
        let json = {type:t,info:this.info}
        this.subToJSON(json)
        return json;
    }
    typeName():string{
        let n = this.constructor.name;
        if (n.startsWith("_"))
            n=n.slice(1);
        return n;
    }
    info:ZJSONInfo={}
    strToCol(str:string):number{
        let len = str.length;
        let col = Math.floor(len/8)+1;
        return col;
    }
    empty():boolean{
        return false;
    }
    abstract valueTypeCheck(val:any):string;
    abstract typeMatch(other:ZT):string;
    protected abstract subToJSON(json:any):any;
    protected abstract subFromJSON(json:any):void;
    static fromJSON(json:any):ZT{
        let t= json.type
        let proto = ztMake(t);
        if (proto){
            proto.info=json.info
            proto.subFromJSON(json)
            return proto
        }
        throw `no registered ZT of type ${t}`
    }
    abstract default():any;
}
export class ZDict extends ZT{
    private fields:ZField[]=[];
    default():{[fieldName:string]:any}{
        if (this.info.default)
            return this.info.default;
        let rslt:{[fieldName:string]:any}={};
        for (let field of this.fields){
            let fn = field.fieldName;
            let def = field.default();
            rslt[fn]=def;
        }
        return rslt;
    }
    empty():boolean{
        return this.fields.length==0;
    }
    str(fieldName:string,info:ZJSONInfo={}):ZDict{
        let field = new ZField(fieldName,new ZString(),info)
        this.fields.push(field)
        return this;
    }
    fileName(fieldName:string,info:ZJSONInfo={}):ZDict{
        let field = new ZField(fieldName,new ZFileName(),info)
        this.fields.push(field)
        return this;
    }
    num(fieldName:string,info:ZJSONInfo={}):ZDict{
        let field = new ZField(fieldName,new ZNumber(),info)
        this.fields.push(field)
        return this;
    }
    bool(fieldName:string,info:ZJSONInfo={}):ZDict{
        let field = new ZField(fieldName,new ZBoolean(),info)
        this.fields.push(field)
        return this;
    }
    code(fieldName:string,codes:(string | number)[],info:ZJSONInfo={}):ZDict{
        let codeType = new ZCode();
        for (let code of codes){
            codeType.code(code,code.toString())
        }
        let field = new ZField(fieldName,codeType,info)
        this.fields.push(field);
        return this;
    }
    array(fieldName:string,elType:ZT,info:ZJSONInfo={}):ZDict{
        let field = new ZField(fieldName,new ZArray(elType),info)
        this.fields.push(field)
        return this;
    }
    add(fieldName:string,fieldType:ZT,info:ZJSONInfo={}):ZDict{
        let field = new ZField(fieldName,fieldType,info)
        this.fields.push(field)
        return this;
    }
    valueTypeCheck(value: any): string {
        if (typeof value !="object")
            return `ZDict recieved a value that is not an object\n`;
        if (Array.isArray(value))
            return `ZDict received an array\n`;
        let err=""
        for (let field of this.fields){
            let vf = value[field.fieldName];
            if (!vf && vf!=0)
                err+= `ZDict value does not have field "${field.fieldName}"\n`
            let fErr = field.type.valueTypeCheck(vf);
            err+=fErr;
        }
        for (let fieldName in value){
            let f = this.getField(fieldName)
            if (!f)
                err+=`ZDict does not have field "${fieldName}"`
        }
        return err;
    }
    typeMatch(other:ZT):string{
        if (!(other instanceof ZDict))
            return `ZDict.typeMatch other is not ZDict`
        let err="";
        for (let field of this.fields){
            let fn = field.fieldName;
            let otherField = other.getField(fn);
            if (otherField){
                let fieldErr = field.type.typeMatch(otherField.type)
                err+=fieldErr;
            } else {
                err+=`field ${fn} not present in other`
            }
        }
        return err;
    }
    fieldNames():string[]{
        let names:string[]=[];
        for (let field of this.fields)
            names.push(field.fieldName)
        return names;
    }
    getField(name:string):ZField | undefined{
        for (let field of this.fields){
            if (field.fieldName==name)
                return field;
        }
    }
    subToJSON(json: any) {
        let fields:any[]=[];
        for (let field of this.fields){
            let json = field.toJSON();
            fields.push(json);
        }
        json.fields=fields;
    }
    subFromJSON(json: any): void {
        this.fields=[];
        for (let field of json.fields){
            let t = ZT.fromJSON(field.type);
            let dField = new ZField(field.fieldName,t,field.info)
            this.fields.push(dField);
        }
    }
}

export class ZNumber extends ZT{
    default():number{
        if (this.info.default)
            return this.info.default;
        return 0
    }
    valueTypeCheck(value: any): string {
        if (typeof value == "number")
            return ""
        else 
            return `ZNumber ${value} is not a number`
    }
    typeMatch(other:ZT):string{
        if (!(other instanceof ZNumber))
            return `ZNumber other is not a ZNumber\n`
        return "";
    }
    protected subToJSON(json: any) {
        return json;
    }
    protected subFromJSON(json: any) {
        return
    }
}

export class ZArray extends ZT{
    default():any[]{
        if (this.info.default)
            return this.info.default;
        return [];
    }
    private elementType:ZT
    getElementType():ZT{
        return this.elementType;
    }
    constructor(elementType:ZT){
        super()
        this.elementType=elementType;
    }
    protected subToJSON(json: any) {
        json.elType = this.elementType.toJSON();
        return json;
    }
    protected subFromJSON(json: any) {
        let elType = ZT.fromJSON(json.elType)
        this.elementType = elType
    }
    valueTypeCheck(value: any): string {
        if (Array.isArray(value)){
            let t = this.elementType;
            let err=""
            for (let ei in value){
                let el = value[ei]
                let vterr = t.valueTypeCheck(el);
                if (vterr!="")
                    err+=`ZArray value[${ei}] does not match element type\n\t${vterr}`
                        
            }
            return err;
        } else {
            return `ZArray value is not an array`
        }
    }
    typeMatch(other:ZT):string{
        if (!(other instanceof ZArray)){
            return `other is not ZArray`
        }
        let t = this.elementType;
        let ot = other.elementType;
        return (t.typeMatch(ot))
    }
}


export class ZField  {
    fieldName:string
    info:ZJSONInfo={}
    type:ZT
    constructor(fieldName:string,type:ZT,info={}){
        this.fieldName=fieldName;
        this.type=type;
        this.info=info;
    }
    toJSON():any{
        let typeJSON = this.type.toJSON();
        return {
            fieldName:this.fieldName,
            info:this.info,
            type:typeJSON
        }
    }
    static fromJSON(json:any):ZField{
        let type = ZT.fromJSON(json.type)
        let field = new ZField(json.fieldName,type,json.info);
        return field;
    }
    default():any{
        if (this.info){
            if (this.info.default){
                return this.info.default;
            }
        }
        return this.type.default();
    }
}


export class ZString extends ZT{
    default():string{
        if (this.info.default)
            return this.info.default;
        return "";
    }
    protected subToJSON(json: any) {
        return json;
    }
    protected subFromJSON(json: any) {
        return;
    }
    valueTypeCheck(value: any): string {
        if (typeof value == "string")
            return ""
        else {
            return `ZString ${value} is not a string`
        }
    }
    typeMatch(other:ZT):string{
        if (!(other instanceof ZString || other instanceof ZFileName))
            return `ZString other is not a ZString\n`
        return "";
    }
}


export class ZFileName extends ZT{
    default():string{
        if (this.info.default)
            return this.info.default;
        return "";
    }
    protected subToJSON(json: any) {
        return json;
    }
    protected subFromJSON(json: any) {
        return;
    }
    valueTypeCheck(value: any): string {
        if (typeof value != "string")
            return `ZFileName ${value} is not a file name`
        let ext = fileExtension(value)
        let v = validExtension(ext)
        if (!v)
            return `ZFileName "${value}" does not have a valid extension`
        return "";
    }
    typeMatch(other:ZT):string{
        if (!(other instanceof ZFileName))
            return `ZFileName other is not a ZFileName\n`
        return "";
    }
}


export class ZBoolean extends ZT{
   
    default():boolean{
        if (this.info.default)
            return this.info.default;
        return true;
    }
    protected subToJSON(json: any) {
        return json;
    }
    protected subFromJSON(json: any) {
        return;
    }
    valueTypeCheck(value: any): string {
        if (typeof value == "boolean")
            return ""
        else 
            return `ZBoolean ${value} is not boolean`
    }
    
    typeMatch(other:ZT):string{
        if (!(other instanceof ZBoolean))
            return `ZBoolean other is not a ZBoolean\n`
        return "";
    }
}

export class ZAny extends ZT{
    
    default():any{
        if (this.info.default)
            return this.info.default;
        return undefined;
    }
    protected subToJSON(json: any) {
        return json;
    }
    protected subFromJSON(json: any) {
        return;
    }
    valueTypeCheck(value: any): string {
        return ""
    }
    typeMatch(other:ZT):string{
        return "";
    }
}


export class ZCode extends ZT{
    default():any{
        if (this.info.default)
            return this.info.default;
        if (this.codes.length>0)
            return this.codes[0].value
        else
            return undefined;
    }
    codes:ZCodeSpec[]=[]
    code(value:(string | number),name?:string,info:ZJSONInfo={}):ZCode{
        if (!name)
            name = value.toString();
        let code=new ZCodeSpec(value,name,info);
        this.codes.push(code);
        return this;
    }
    codeVals():(string | number)[]{
        let vals:(string | number)[]=[];
        for (let code of this.codes){
            let val = code.value;
            vals.push(val);
        }
        return vals;
    }
    protected subToJSON(json: any) {
        let codesJSON=[];
        for (let code of this.codes){
            let j = code.toJSON();
            codesJSON.push(j)
        }
        json.codes=codesJSON;
        return json;
    }
    protected subFromJSON(json: any) {
        let codesJSON = json.codes;
        this.codes=[]
        for (let codeJSON of codesJSON){
            let code = ZCodeSpec.fromJSON(codeJSON)
            this.codes.push(code);
        }
        return 
    }
    
    valueTypeCheck(value: any): string {
        for (let code of this.codes){
            if (code.value==value)
                return ""
        }
        return `ZCode "${value}" is not a valid code`
    }
    typeMatch(other:ZT):string{
        if (!(other instanceof ZCode))
            return `ZCode other is not a ZCode\n`
        let err = "";
        let otherVals = other.codeVals();
        let thisVals = this.codeVals();
        for (let v of thisVals){
            if (otherVals.indexOf(v)<0)
                err += `value ${v} is not found in other`
        }
        for (let v of otherVals){
            if (thisVals.indexOf(v)<0)
                err += `value ${v} is not found in this`
        }
        return err;
    }
}

export class ZCodeSpec {
    value:string | number
    name:string
    info:ZJSONInfo
    constructor (value:string|number,name?:string,info:ZJSONInfo={}){
        this.value=value;
        if (name){
            this.name=name
        } else {
            this.name=value.toString();
        }
        this.info=info;
    }
    toJSON():any{
        return {value:this.value,name:this.name,info:this.info}
    }
    static fromJSON(json:any):ZCodeSpec{
        return new ZCodeSpec(json.value,json.name,json.info);
    }
}
export type ZJSONInfo = {
    desc?:string,
    default?:any,
    //chooseOne?:ZListSourceAb,
    quantum?:number,
    decimals?:number,
    outcomes?:string[],
    extensions?:string[],
    path?:string
}
export class ZAlternative  extends ZT{
    default():any{
        if (this.info.default)
            return this.info.default;
        if (this.alternatives.length>0)
            return this.alternatives[0].default();
        else
            return undefined;
    }
    alternatives:ZT[]=[];
    alt(altType:ZT):ZAlternative{
        this.alternatives.push(altType)
        return this;
    }
    protected subToJSON(json: any) {
        let jsonAlts=[];
        for (let alt of this.alternatives){
            let jsonAlt = alt.toJSON();
            jsonAlts.push(jsonAlt);
        }
        json.alts=jsonAlts;
    }
    protected subFromJSON(json: any): void {
        this.alternatives=[];
        let jsonAlts = json.alts;
        for (let jsonAlt of jsonAlts){
            let alt = ZT.fromJSON(jsonAlt);
            this.alternatives.push(alt);
        }
    }

    valueTypeCheck(value: any): string {
        for (let alt of this.alternatives){
            let err = alt.valueTypeCheck(value)
            if (err=="")
                return "";
        }
        return `ZAlternative ${value} does not match any of the alternative types`
    }
    typeMatch(other:ZT):string{
        if (!(other instanceof ZAlternative))
            return `other is not a ZAlternative`
        for (let alt of this.alternatives){
            let found = false;
            for (let oAltI =0;oAltI< other.alternatives.length && !found;oAltI++){
                let oAlt=other.alternatives[oAltI]
                if (alt.typeMatch(oAlt)==""){
                    found=true;
                }
            }
            if(!found)
                return "ZAlternative type missmatch"
        }
        return "";
    }
}

export function ztMake(type:string):ZT{
    switch(type){
        case "ZDict": return new ZDict();
        case "ZNumber": return new ZNumber();
        case "ZArray" : return new ZArray(new ZAny());
        case "ZString" : return new ZString();
        case "ZFileName": return new ZFileName();
        case "ZBoolean": return new ZBoolean();
        case "ZAny": return new ZAny();
        case "ZCode": return new ZCode();
        case "ZAlternative": return new ZAlternative();
        default:
            throw `no such zTypeMake("${type}")`
    }
}

export type ZTJSON = {
    
}