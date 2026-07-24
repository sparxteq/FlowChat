


export class NameString{
    static toCamel(str:string,capFirst=false):string{
        let words = this.splitWords(str);
        let noEmpties = this.removeEmpties(words);
        let capWords = this.capWords(noEmpties,capFirst);
        let rslt = capWords.join("");
        return rslt;
    }
    static toKabob(str:string):string{
        let words = this.splitWords(str);
        let noEmpties = this.removeEmpties(words);
        let rslt = noEmpties.join("-");
        return rslt;
    }
    static toSnake(str:string):string{
        let words = this.splitWords(str);
        let noEmpties = this.removeEmpties(words);
        let rslt = noEmpties.join("_");
        return rslt;

    }
    static toCapSpaced(str:string):string{
        let words = this.splitWords(str);
        let noEmpties = this.removeEmpties(words);
        let firstWord = noEmpties[0];
        noEmpties[0]=
        noEmpties[0]=firstWord.charAt(0).toUpperCase()+firstWord.slice(1).toLowerCase()
        let rslt = noEmpties.join(" ");
        return rslt;

    }
    private static removeEmpties(sa:string[]):string[]{
        let rslt:string[]=[];
        for (let s of sa){
            if (s.length>0)
                rslt.push(s);
        }
        return rslt;
    }
    private static capWords(words:string[],capFirst=false):string[]{
        let rslt:string[]=[];
        let firstWord = words[0];
        if (capFirst){
            let nw = firstWord.charAt(0).toUpperCase()+firstWord.slice(1).toLowerCase();
            rslt.push(nw)
        } else {
            rslt.push(firstWord.toLowerCase())
        }
        for (let i=1;i<words.length;i++){
            let word = words[i]
            let nw = word.charAt(0).toUpperCase()+word.slice(1).toLowerCase()
            rslt.push(nw)
        }
        return rslt;
    }
    private static splitWords(text: string): string[] {
        return text
            // Normalize separators to spaces
            .replace(/[-_]+/g, " ")

            // Split camelCase
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")

            // Split acronym followed by normal word
            // XMLParser -> XML Parser
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")

            // Split into words
            .trim()
            .split(/\s+/)

            // Normalize case
            .map(w => w.toLowerCase());
    }
}