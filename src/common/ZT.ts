


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