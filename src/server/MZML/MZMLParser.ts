import * as pako  from "pako";
import { DB } from "../../../../Zing3/share/DB";
import { MassSpecData } from "../tables/MassSpecData";
import { WorkerToParent } from "../workers/WorkerToParent";
import { FilesFS } from "../files/FilesFS";
import { XMLLex, XMLTagInfo } from "./XMLLex";
import { ParseAllDataPointsRow } from "../units/ParseAllDataPoints";
import { WorkNotifyI } from "../workers/WorkNotifyI";

export class MZMLParser {
    private msData:MassSpecData;
    private sourceFileName="";
    private mzBin:number;
    private rtBin:number;
    private imBin:number;
    private wnote:WorkNotifyI;
    constructor(msData:MassSpecData,wnote:WorkNotifyI){
        this.msData=msData;
        this.mzBin=msData.mzQuantum;
        this.rtBin=msData.rtQuantum;
        this.imBin=msData.imQuantum;
        this.wnote=wnote;
    }
    private rowCount=-1;
    private nRows=-1;
    //async parseData(project:ZProject,assemblyInfo:StepExamplesToParseRow):Promise<void>{
    async parseData(projectPath:string,file:FilesFS,assemblyInfo:ParseAllDataPointsRow,rowCount:number,nRows:number):Promise<void>{
        this.rowCount=rowCount;
        this.nRows=nRows;
        this.sourceFileName=assemblyInfo.sourceFile;
        let cache:MassSpecData | undefined = await this.checkCache(projectPath,this.sourceFileName)
        if (cache){
            this.msData.merge(cache);
        } else {
            if (file){
                await file.openR();
                let lex = new XMLLex(file);
                await this.mzmlParse(lex,assemblyInfo);
                await file.close();
            }
        }
    }
    private async checkCache(projectPath:string,fileName:string):Promise<MassSpecData|undefined>{
        return undefined;
    }
    private exId:string="";
    private srcId:string="";
    private async mzmlParse(lex:XMLLex,info:ParseAllDataPointsRow):Promise<void>{
        this.exId=info.exampleId;
        this.srcId=info.sourceId;
        this.msData.addOutcome(this.exId,info.outcome);
        let runTag = this.skipUntilTag(lex,"run","mzML",null);
        await this.parseRun(lex,runTag);
    }
    private addRec(mz:number,rt:number,im:number,ab:number){
        this.msData.add(this.exId,this.srcId,rt,im,mz,ab);
    }
    private async parseRun(lex:XMLLex,runTag:XMLTagInfo):Promise<void>{
        let spectrumList = this.skipUntilTag(lex,"spectrumList", "run", runTag);
        if (!spectrumList) {
            //DB.end("parseRun")
            return;
        }
        let endTag = await this.parseSpectrumList(lex,spectrumList)
    }
    private nSpectra=0;
    private async parseSpectrumList(lex:XMLLex,sl: XMLTagInfo): Promise<XMLTagInfo> {
        //DB.start("parseSpectrumList")
        this.nSpectra = parseInt(sl.attributes.count);
        let tag = this.skipUntilTag(lex,"spectrum", "spectrumList", sl)
        let specCount=1;
        while (tag && tag.tag == "spectrum") {
            tag = await this.parseSpectrum(lex,tag)
            this.wnote.logStatus(`parsed (${this.rowCount} / ${this.nRows}) '${this.sourceFileName}' ${specCount++}/${this.nSpectra}`)
        }
        tag = this.checkEnd(lex,tag, "spectrumList")
        //DB.end("parseSpectrumList")
        return tag;
    }
    private lastSpectrumIdx=0;
    private nMSMore=0;
    private nMS1=0;
    private async parseSpectrum(lex:XMLLex,spectrum: XMLTagInfo): Promise<XMLTagInfo> {
        //DB.start("parseSpectrum")
        let index = parseInt(spectrum.attributes.index);
        if (index - this.lastSpectrumIdx >= 100) {
            this.wnote.logStatus(`${this.srcId} ${index.toLocaleString()} / ${this.nSpectra.toLocaleString()}`)
            this.lastSpectrumIdx = index;
        }
        let tag = lex.nextTag();
        let isMS1 = true;
        while (tag && tag.tag == "cvParam") {
            let accession = tag.attributes.accession;
            if (accession) {
                if (accession == "MS:1000511") {
                    let valAttr = tag.attributes.value;
                    if (valAttr != "1") {
                        isMS1 = false;
                        this.nMSMore++;
                    } else {
                        this.nMS1++;
                    }
                }
            }
            tag = lex.nextTag();
        }
        if (isMS1) {
            if ((<XMLTagInfo>tag).tag != "scanList")
                tag = this.skipUntilTag(lex,"scanList", "spectrum", spectrum);
            while (tag && tag.tag == "scanList") {
                tag = this.parseScanList(lex,tag);
            }
            tag = this.skipUntilTag(lex,"binaryDataArrayList", "spectrum", <XMLTagInfo>tag)
            tag = await this.parseBinaryDataArrayList(lex,tag);
        } else {
            tag = this.skipUntilTag(lex,"??", "spectrum", <XMLTagInfo>tag)
        }
        tag = this.checkEnd(lex,tag, "spectrum")
        //DB.end("parseSpectrum")
        return <XMLTagInfo>tag;
    }
    private parseScanList(lex:XMLLex,scanList: XMLTagInfo): XMLTagInfo {
        //DB.start("parseScanList")
        let tag = this.skipUntilTag(lex,"scan", "scanList", scanList);
        tag = this.parseScan(lex,tag);
        tag = this.checkEnd(lex,tag, "scanList")
        //DB.end("parseScanList")
        return tag;
    }
    private scanStartTime: number=-1;
    private parseScan(lex:XMLLex,scan: XMLTagInfo): XMLTagInfo {
        //DB.start("parseScan")
        let tag = lex.nextTag();
        while (tag && tag.tag == "cvParam") {
            let accession = tag.attributes.accession;
            if (accession) {
                switch (accession) {
                    case "MS:1000016":
                        if (tag.attributes.unitAccession == "UO:0000010")
                            this.scanStartTime = parseFloat(tag.attributes.value);
                        else if (tag.attributes.unitAccession == "UO:0000031")
                            this.scanStartTime = parseFloat(tag.attributes.value) * 60;
                        break;
                }
            }
            tag = lex.nextTag();
        }
        while (tag && tag.tag != "scan")
            tag = lex.nextTag();
        tag = this.checkEnd(lex,<XMLTagInfo>tag, "scan");
        //DB.end("parseScan")
        return <XMLTagInfo>tag;
    }
    private mz: number[]=[];
    private vol: number[]=[];

    private async parseBinaryDataArrayList(lex:XMLLex,bdal: XMLTagInfo): Promise<XMLTagInfo> {
        //DB.start("parseBinaryDataArrayList")
        let tag = this.skipUntilTag(lex,"binaryDataArray", "binaryDataArrayList", bdal)
        tag = this.parseBinaryDataArray(lex,tag);
        tag = this.skipUntilTag(lex,"binaryDataArray", "binaryDataArrayList", tag)
        tag = this.parseBinaryDataArray(lex,tag);
        await this.accumulateBinaryData();
        tag = this.checkEnd(lex,tag, "binaryDataArrayList")
        //DB.end("parseBinaryDataArrayList")
        return tag;
    }
    private async accumulateBinaryData(): Promise<void> {
        let rt = this.scanStartTime;
        let len = this.mz.length;
        for (let i = 0; i < len; i++) {
            let mz = this.mz[i];
            let vol = this.vol[i];
            this.addRec(mz,rt,-1,vol);
        }
        this.mz = [];
        this.vol = [];
    }
    private parseBinaryDataArray(lex:XMLLex,bda: XMLTagInfo): XMLTagInfo {
        //DB.start("parseBinaryDataArray")
        let tag = lex.nextTag();
        let name: string |null = null;
        let compression = "none";
        let numberFormat = "float64";
        while (tag && tag.tag == "cvParam") {
            let accession = tag.attributes.accession;
            if (accession) {
                switch (accession) {
                    case "MS:1000514":
                        name = "m/z"
                        break;
                    case "MS:1000515":
                        name = "vol";
                        break;
                    case "MS:1000521":
                        numberFormat = "float32";
                        break;
                    case "MS:1000523":
                        numberFormat = "float64";
                        break;
                    case "MS:1000574":
                        compression = "zlib";
                        break;
                    case "MS:1000576":
                        compression = "none";
                        break;
                }
            }
            tag = lex.nextTag();
        }
        if (tag && tag.tag == "binary") {
            this.parseBinary(lex,<string>name, numberFormat, compression);
        }
        tag = <XMLTagInfo>lex.nextTag();
        tag = this.checkEnd(lex,tag, "binaryDataArray")
        //DB.end("parseBinaryDataArray")
        return <XMLTagInfo>tag;
    }
    private nBinaryDecoded=0;
    private sumBinaryLength=0;
    private parseBinary(lex:XMLLex,name: string, format: string, compression: string) {
        //DB.start("parseBinary")
        let uncompressed = "";
        let binaryText = this.getBinaryText(lex);
        switch (compression) {
            case "none":
                uncompressed = binaryText;
                break;
            case "zlib":
                let b64Data = binaryText;
                let strData = mzmlAtoB(b64Data);
                let charData = strData.split('').map((x:any) => { return x.charCodeAt(0) });
                let binData = new Uint8Array(charData);
                let data = pako.inflate(binData)
                try {
                    let str = this.stringFromUint8(data);
                    str = mzmlBtoA(str);
                    uncompressed = str;
                } catch (e) {
                    DB.msg("e", e);
                }
                break;
            default:
                DB.msg(`MzmlXML unrecognized mzML binary compression "${compression}"`)
                break;
        }
        let data:number[] = [];
        switch (format) {
            case "float64":
                data = this.stringToFloat64Array(uncompressed);
                break;
            case "float32":
                data = this.stringToFloat32Array(uncompressed);
                break;
            default:
                DB.msg(`MzmlXML unrecognized mxML binary number format "${format}"`);
                break;
        }
        this.nBinaryDecoded++;
        this.sumBinaryLength += data.length;
        switch (name) {
            case "m/z":
                this.mz = data;
                break;
            case "vol":
                this.vol = data;
                break
        }
        //DB.end("parseBinary")
    }
    private getBinaryText(lex:XMLLex): string {
        //DB.start("getBinaryText")
        let text = lex.tagText("binary");
        //DB.end("getBinaryText",text.length)
        return text;
    }
    private checkEnd(lex:XMLLex,tag: XMLTagInfo, tagName: string): XMLTagInfo {
        if (tag.tag != tagName || !tag.isEndTag) {
            this.wnote.msg(`found ${this.tagText(tag)} when expecting </${tagName}>`)
        }
        return <XMLTagInfo>lex.nextTag();
    }
    private tagText(tag: XMLTagInfo): string {
        if (tag.isEndTag) {
            return `</${tag.tag}>`
        } else if (tag.terminated) {
            return `<${tag.tag}/>`
        } else
            return `<${tag.tag}>`
    }
    private skipUntilTag(lex:XMLLex,tagName: string, endTagName: string, lastTag: XMLTagInfo | null): XMLTagInfo {
        let tag = lastTag;
        if (tag && tag.tag == tagName)
            return tag
        else if (tag && tag.tag == endTagName && tag.isEndTag) {
            return tag;
        } else
            tag = <XMLTagInfo>lex.nextTag();
        while (tag && tag.tag != tagName && !this.endTag(tag, endTagName)) {
            tag = <XMLTagInfo>lex.nextTag();
        }
        return tag;
    }
    private endTag(tag: XMLTagInfo, endTagName: string): boolean {
        if (!endTagName)
            return false;
        if (!tag)
            return false;
        if (tag.tag == endTagName && tag.isEndTag)
            return true;
        else
            return false;
    }
    private stringFromUint8(uint8: Uint8Array): string {
        let rslt = "";
        let len = uint8.length;
        for (let i = 0; i < len; i++) {
            rslt += String.fromCharCode(uint8[i])
        }
        return rslt;
    }
    protected stringToFloat64Array(base64: string): number[] {
        let blob = mzmlAtoB(base64);
        let fLen = Math.ceil(blob.length / Float64Array.BYTES_PER_ELEMENT);
        let dView = new DataView(new ArrayBuffer(Float64Array.BYTES_PER_ELEMENT));
        let fAry: number[] = [];
        fAry.length = fLen;
        let p = 0;
        for (let j = 0; j < fLen; j++) {
            p = j * 8;
            dView.setUint8(0, blob.charCodeAt(p))
            dView.setUint8(1, blob.charCodeAt(p + 1))
            dView.setUint8(2, blob.charCodeAt(p + 2))
            dView.setUint8(3, blob.charCodeAt(p + 3))
            dView.setUint8(4, blob.charCodeAt(p + 4))
            dView.setUint8(5, blob.charCodeAt(p + 5))
            dView.setUint8(6, blob.charCodeAt(p + 6))
            dView.setUint8(7, blob.charCodeAt(p + 7))
            fAry[j] = dView.getFloat64(0, true)
        }
        return fAry
    }
    protected stringToFloat32Array(base32: string): number[] {
        let blob = mzmlAtoB(base32);
        let fLen = Math.ceil(blob.length / Float32Array.BYTES_PER_ELEMENT);
        let dView = new DataView(new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT))
        let fAry: number[] = []
        fAry.length = fLen;
        let p = 0;
        for (let j = 0; j < fLen; j++) {
            p = j * 4;
            dView.setUint8(0, blob.charCodeAt(p))
            dView.setUint8(1, blob.charCodeAt(p + 1))
            dView.setUint8(2, blob.charCodeAt(p + 2))
            dView.setUint8(3, blob.charCodeAt(p + 3))
            fAry[j] = dView.getFloat32(0, true)
        }
        return fAry
    }
}
var mzmlAtoB = typeof atob === 'function' ? atob : ((s:any) => {
    DB.start("atob")
    let bf = Buffer.from(s, 'base64')
    let st = bf.toString('binary')
    DB.end()
    return st
});
var mzmlBtoA = typeof btoa === 'function' ? btoa : ((s:any) => Buffer.from(s).toString('base64'));
