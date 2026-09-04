

export class Names {
    private encodeCharsSet:{[char:number]:boolean}={};
    constructor(charsToEncode:string){
        for (let i=0;i<charsToEncode.length;i++){
            let cc = charsToEncode.charCodeAt(i)
            this.encodeCharsSet[cc]=true;
        }
        this.encodeCharsSet["%".charCodeAt(0)]=true;
    }
    encode(input:string):string{
        let rslt = input.replace(/./g,(char:string)=>{
            let cc = char.charCodeAt(0);
            if (this.encodeCharsSet[cc]){
                let rslt = "%"+char.charCodeAt(0).toString(16).padStart(2,"0");
                return rslt;
            } else {
                return char
            }
        })
        return rslt;
    }
    decode(input: string): string {
        try {
            return decodeURIComponent(input);
        } catch (e) {
            console.error("Invalid percent-encoded string:", input);
            return ""
        }
    }
    static validId(id:string):boolean{
        if (id.startsWith("_"))
            return false;
        const pattern = /^[A-Za-z0-9./]+$/;
        let test = pattern.test(id)
        return test;
    }
}