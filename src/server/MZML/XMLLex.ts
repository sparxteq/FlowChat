import { DB } from "../../../../Zing3/share/DB";
import { FilesFS } from "../files/FilesFS";

export class XMLLex {
    private file:FilesFS
    private nextCharN:number;
    private nextChar:string="";
    constructor(file:FilesFS){
        this.file=file
        this.nextChar=" ";
        this.nextCharN=this.space;
    }
    private get():number{
        let c = this.file.readCharSync();
        if (c==null || c.length==0){
            this.nextCharN =  0;
            this.nextChar = "";
        }else {
            this.nextCharN=c.charCodeAt(0);
            this.nextChar=c;
        }
        return this.nextCharN;
    }
    private a="a".charCodeAt(0);
    private z="z".charCodeAt(0);
    private A="A".charCodeAt(0);
    private Z="Z".charCodeAt(0);
    private n0="0".charCodeAt(0);
    private n9="9".charCodeAt(0);
    private lt="<".charCodeAt(0);
    private gt=">".charCodeAt(0);
    private q="?".charCodeAt(0);
    private slash="/".charCodeAt(0);
    private eq="=".charCodeAt(0);
    private sq="'".charCodeAt(0);
    private dq='"'.charCodeAt(0);
    private space=" ".charCodeAt(0);
    nextTag():XMLTagInfo|null{
        while (this.nextCharN>0 && this.nextCharN!=this.lt)
            this.get();
        this.get();
        if (this.nextCharN==this.q)
            this.clearProlog();
        else if (this.nextCharN==this.slash){
            return this.endTag();
        }
        let tagName=this.nextChar;
        this.get();
        while(this.isAlphaNum()){
            tagName+=this.nextChar;
            this.get();
        };
        let atts={};
        while(this.getAttribute(atts)){

        }
        while (this.nextCharN!=this.slash && this.nextCharN!=this.gt){
            this.get();
        }
        let terminated=false;
        if (this.nextCharN==this.slash){
            this.get() // move to the >
            this.get() // skip over the >
            terminated=true;
        } else if (this.nextCharN==this.gt){
            this.get() // skip over the >
        }
        let rslt:XMLTagInfo={
            tag:tagName,
            attributes:atts,
            terminated:terminated,
            isEndTag:false
        }
        return rslt;
    }
    tagText(endTag:string):string{
        let nc =this.nextChar;
        let rslt = nc+this.file.readUntilSync(this.lt);
        this.get();
        if (this.nextCharN == this.lt){
            this.get();
        }
        if (this.nextCharN!=this.slash){
            DB.msg("did not find </ at end of text")
            
        } else {
            this.get();
        }
        let tag="";
        while (this.nextCharN>0 && this.nextCharN!=this.gt){
            tag+=this.nextChar;
            this.get();
        }
        this.get(); // consume >
        if (tag!=endTag){
            DB.msg(`expecting </${endTag}> but found </${tag}>`)
            
        }
        return rslt;
    }
    private endTag():XMLTagInfo|null{
        this.get();
        let tagName="";
        while (this.isAlphaNum()){
            tagName+=this.nextChar;
            this.get();
        }
        this.skipWhite();
        if (this.nextCharN==this.gt){
            this.get();
            return {
                tag:tagName,
                attributes:{},
                terminated:false,
                isEndTag:true
            }
        }
        return null;
    }

    private getAttribute(atts:{[name:string]:string}):boolean{
        this.skipWhite();
        if (this.nextCharN==this.slash || this.nextCharN==this.gt){
            return false;
        }
        while(!this.isAlpha() && this.nextCharN!=0) 
            this.get();
        let attName = this.nextChar;
        this.get();
        while(this.isAlphaNum()){
            attName+=this.nextChar;
            this.get();
        }
        this.skipWhite();
        if (this.nextCharN==this.eq){
            this.get();
            this.skipWhite();
            if (this.isQuote()){
                let quoteStart = this.nextCharN;
                this.get();
                let attVal="";
                while(this.nextCharN!=quoteStart){
                    attVal+=this.nextChar;
                    this.get();
                }
                this.get();
                this.skipWhite();
                atts[attName]=attVal;
                return true;
            }
        }
        return false;
    }
    private clearProlog(){
        while (this.nextCharN!=this.lt){
            this.get();
        }
        this.get();
    }
    private isAlpha():boolean{
        let n = this.nextCharN;
        return (n>=this.a && n<=this.z) || (n>=this.A && n<=this.Z)
    }
    private isAlphaNum():boolean{
        let n = this.nextCharN;
        return (n>=this.a && n<=this.z) || (n>=this.A && n<=this.Z) || (n>=this.n0 && n<=this.n9)
    }
    private skipWhite(){
        while (this.nextCharN<=this.space)
            this.get();
    }
    private isQuote():boolean{
        return this.nextCharN==this.sq || this.nextCharN==this.dq;
    }
}

export type XMLTagInfo = {
    tag:string,
    attributes:{[attName:string]:string},
    terminated:boolean,
    isEndTag:boolean
}