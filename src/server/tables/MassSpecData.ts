import { DB } from "../../../../Zing3/share/DB";
import { Log } from "../../client/log/Log";
import { FilesFS } from "../files/FilesFS";
import { MSSelectSieve } from "../MZML/MSSelectSieve";





const startLevel=-1;
const srcLevel=0;
const imLevel=1;
const rtLevel=2;
const mzLevel=3;
const exLevel=4;
const abLevel=5;
export class MassSpecData{
    data:MsData={}
    rtQuantum:number
    imQuantum:number
    mzQuantum:number
    ms2Quantum:number;
    exampleIdxTable:{[exampleId:string]:number}={};
    exampleIdList:string[]=[];
    outcomes:string[]=[]
    outcomeCodes:{[outcome:string]:number}={}
    nCodes=0;
    maxRt=0;
    
    constructor(rtQuantum:number,imQuantum:number,mzQuantum:number,ms2Quantum=-1){
        this.rtQuantum=rtQuantum;
        this.imQuantum=imQuantum;
        this.mzQuantum=mzQuantum;
        this.ms2Quantum=ms2Quantum;
    }
    private sieve?:MSSelectSieve
    setSieve(sieve:MSSelectSieve){
        this.sieve=sieve;
    }
    addOutcome(exampleId:string,outcome:string){
        let exIdx = this.exampleIdxTable[exampleId]
        if (!exIdx && exIdx!=0){
            exIdx = this.exampleIdList.length;
            this.exampleIdxTable[exampleId]=exIdx;
            this.exampleIdList.push(exampleId)
        }
        this.outcomes[exIdx]=outcome;
        let oc = this.outcomeCodes[outcome]
        if (!oc && oc!=0){
            this.outcomeCodes[outcome]=this.nCodes;
            this.nCodes++
        }
    }
    private quantize(val:number, quantum:number):number{
        if (quantum<=0)
            return -1;
        if (val<0)
            return -1;
        let q = Math.floor((val+0.0000000001)/quantum)*quantum;
            // 0.000000001 accounts for differences between binary and decimal
        return q;
    }
    add(exampleId:string,srcId:string,rt:number,im:number,mz:number,abundance:number,ms2=-1){
        let idx = this.exampleIdxTable[exampleId]
        if (!idx && idx!=0){
            idx = this.exampleIdList.length;
            this.exampleIdList.push(exampleId);
            this.exampleIdxTable[exampleId]=idx;
        }
        rt = this.quantize(rt,this.rtQuantum);
        im = this.quantize(im,this.imQuantum);
        mz = this.quantize(mz,this.mzQuantum);
        ms2 = this.quantize(ms2,this.ms2Quantum);
        if (this.sieve){
            if (!this.sieve.accept({srcId:srcId,mz:mz,rt:rt,im:im,ms2:ms2}))
                return;
        }
        if (rt>this.maxRt)
            this.maxRt=rt;
        let srcData = this.data[srcId]
        if (!srcData){
            srcData = {};
            this.data[srcId]=srcData
        }
        let rtData = srcData[im];
        if (!rtData){
            rtData={};
            srcData[im]=rtData;
        }

        let mzData = rtData[rt];
        if (!mzData){
            mzData={};
            rtData[rt]=mzData;
        }

        let ms2Data = mzData[mz];
        if (!ms2Data){
            ms2Data={};
            mzData[mz]=ms2Data
        }

        let exData = ms2Data[ms2];
        if (!exData){
            exData = [];
            ms2Data[ms2]=exData;
        }

        if (!exData[idx]){
            exData[idx]=abundance;
        } else {
            exData[idx]+=abundance;
        }
    }
    private log?:Log;
    async writeData(f:FilesFS,log?:Log):Promise<void>{
        this.log=log;
        let bufFile = new MSDBufferFile(f)
        let parts = f.fullPath().split("/");
        let fn = parts[parts.length-1]
        if (log) log.start(`writing ${fn}`)
        //bufFile.writelnSync("{");
        let srcValStr:string[]=Object.keys(this.data);
        srcValStr.sort((a,b)=>{
            return a.localeCompare(b);
        })
        for (let src of srcValStr){
            this.writeSrc(this.data[src],src,bufFile)
        }
        //bufFile.writelnSync("}");
        await bufFile.close();
        if (log) log.end(`writing ${fn}`);
    }
    private writeSrc(srcD:MsImData,srcId:string,file:MSDBufferFile){
        file.writelnSync(`{${srcId}`);
        let imValStr = Object.keys(srcD);
        let imVals:number[]=[];
        for (let imVal of imValStr){
            let im = Number.parseFloat(imVal);
            imVals.push(im)
        }
        imVals.sort((a,b)=>{
            return a-b
        })
        for (let im of imVals){
            this.writeIm(srcD[im],im,file)
        }
        file.writelnSync("}")
    }
    
    private writeIm(imD:MsRtData,im:number,file:MSDBufferFile){
        file.writelnSync(`{${im}`);
        let rtValStr = Object.keys(imD);
        let rtVals:number[]=[];
        for (let rtVal of rtValStr){
            let rt = Number.parseFloat(rtVal);
            rtVals.push(rt);
        }
        rtVals.sort((a,b)=>{
            return a-b;
        })
        for (let rt of rtVals){
            this.writeRt(imD[rt],rt,file)
        }
        file.writelnSync("}")
    }
    private  writeRt(rtD:MsMzData,rt:number,file:MSDBufferFile){
        if (this.log) this.log.status(`RT ${rt}/${this.maxRt}`)
        file.writelnSync(`{${rt}`);
        let mzValStr = Object.keys(rtD);
        let mzVals:number[]=[];
        for (let mzVal of mzValStr){
            let mz = Number.parseFloat(mzVal);
            mzVals.push(mz);
        }
        mzVals.sort((a,b)=>{
            return a-b
        })
        for (let mz of mzVals){
            this.writeMZ(rtD[mz],mz,file)
        }
        file.writelnSync("}")
    }
    private  writeMZ(mzD:Msms2Data,mz:number,file:MSDBufferFile){
        file.writelnSync(`{${mz.toFixed(6)}`);
        let ms2ValStr = Object.keys(mzD);
        let ms2Vals:number[]=[];
        for (let ms2Val of ms2ValStr){
            let ms2 = Number.parseFloat(ms2Val);
            ms2Vals.push(ms2);
        }
        ms2Vals.sort((a,b)=>{
            return a-b
        })
        for (let ms2 of ms2Vals){
            this.writems2(mzD[ms2],ms2,file);
        }
        file.writelnSync("}")
    }
    private  writems2(ms2D:number[],ms2:number,file:MSDBufferFile){
        file.writelnSync(`{${ms2}`);
        file.writelnSync("{")
        for (let ms2 of ms2D){
            if (ms2)
                file.writelnSync(ms2.toFixed(2));
            else
                file.writelnSync("0")
        }
        file.writelnSync('}')
    }
    private level=startLevel;
    private exIdx=0;
    private levelData:MsRecord = {
        exId:"",
        srcId:"",
        im:-1,
        rt:-1,
        mz:-1,
        ab:-1,
        ms2:-1
    }
    async buildData(file:FilesFS,exampleIds:string[],outcomes:string[]):Promise<void>{
        this.exampleIds=exampleIds;
        this.data = {};
        this.outcomes=outcomes;
        this.outcomeCodes={};
        this.nCodes=0;
        for (let oc of outcomes){
            let occ = this.outcomeCodes[oc]
            if (!occ && occ!=0){
                this.outcomeCodes[oc]=this.nCodes;
                this.nCodes++;
            }
        }
        let next = await this.next(file)
        while (next){
            this.add(next.exId,next.srcId,next.rt,next.im,next.mz,next.ab,next.ms2);
            next = await this.next(file);
        }
    }
    exampleIds:string[]=[];
    next(file:FilesFS):MsRecord|undefined{
        let next =  this.nextLine(file)
        return next;
    }
    private nextLine(file:FilesFS):MsRecord|undefined{
        let line = file.readlnSync();
        if (!line)
            return ;
        let parts:string[]=[];
        switch(this.level){
            case startLevel:
                if (line=="{"){
                    this.level=srcLevel;
                    return this.nextLine(file);
                } else if (line == "}"){
                    return 
                } else {
                    DB.msg("expecting end of file }")
                    return;
                }
            case srcLevel:
                parts = line.split(" ");
                if (parts[0]=="{"){
                    this.levelData.srcId = parts[1];
                    this.level++;
                    return this.nextLine(file)
                } else if (parts[0]=="}"){
                    this.level--;
                    return this.nextLine(file);
                } else {
                    DB.msg("expecting end of srcId }")
                    return;
                }
            case imLevel:
                parts = line.split(" ");
                if (parts[0]=="{"){
                    this.levelData.im = Number.parseFloat(parts[1])
                    this.level++;
                    return this.nextLine(file);
                } else if (parts[0]=="}"){
                    this.level--;
                    return this.nextLine(file);
                } else {
                    DB.msg("expecting end of im }")
                    return;
                }
            case rtLevel:
                parts = line.split(" ");
                if (parts[0]=="{"){
                    this.levelData.rt = Number.parseFloat(parts[1])
                    this.level++;
                    return this.nextLine(file);
                } else if (parts[0]=="}"){
                    this.level--;
                    return this.nextLine(file);
                } else {
                    DB.msg("expecting end of rt }")
                    return;
                }
            case mzLevel:
                parts = line.split(" ");
                if (parts[0]=="{"){
                    this.levelData.mz = Number.parseFloat(parts[1])
                    this.level++;
                    this.exIdx=0;
                    return this.nextLine(file);
                } else if (parts[0]=="}"){
                    this.level--;
                    return this.nextLine(file);
                } else {
                    DB.msg("expecting end of mz }")
                    return;
                }
            case exLevel:
                if (line!="}"){
                    this.levelData.ab = Number.parseFloat(line)
                    this.levelData.exId=this.exampleIds[this.exIdx];
                    this.exIdx++;
                    return {...this.levelData};
                } else if (line=="}"){
                    this.level--;
                    return this.nextLine(file);
                } else {
                    DB.msg("expecting end of ex ]")
                    return;
                }
            case abLevel:
                if (line=="]"){
                    this.level--;
                    return this.nextLine(file);
                }
                let ab = Number.parseInt(line)
                if (isNaN(ab)){
                    DB.msg(`ab "${ab}" is not a number`)
                    return;
                }
                this.levelData.ab = ab;
                return this.levelData;
            default:
                return this.levelData;
        }
    }
    lastFeature:MsFeature = {
        srcId:"",
        im:-1,
        rt:-1,
        mz:-1,
        abs:[],
        exIds:[]
    }
    async nextFeature(file:FilesFS):Promise<MsFeature | undefined>{
        let lf = this.lastFeature; 
        if (lf.im==-1){
            let rec = await this.next(file);
            if (rec){
                lf.im=rec.im;
                lf.rt=rec.rt;
                lf.mz=rec.mz;
                lf.abs=[rec.ab];
                lf.exIds=[rec.exId]
                lf.srcId=rec.srcId;
            } else
                return
        }
        let rec = await this.next(file);
        if (!rec) return;
        while (rec && rec.mz==lf.mz && rec.rt==lf.rt && rec.im==lf.im){
            lf.abs.push(rec.ab);
            lf.exIds.push(rec.exId)
            rec = await this.next(file);
        }
        let save = lf;
        if (rec){
            this.lastFeature = {
                srcId:rec.srcId,
                im:rec.im,
                rt:rec.rt,
                mz:rec.mz,
                abs:[rec.ab],
                exIds:[rec.exId]
            }
        } else {
            this.lastFeature = {
                srcId:"",
                im:-1,
                rt:-1,
                mz:-1,
                abs:[],
                exIds:[]
            }
        }
        return save;
    }
    merge(src:MassSpecData){
        let exIds = src.exampleIdList;
        let data = src.data;
        for (let src in data){
            this.mergeSrc(src,data[src],exIds)
        }
    }
    private mergeSrc(src:string,imData:MsImData,exIds:string[]){
        for (let im in imData){
            let imn = Number.parseFloat(im);
            let rtData=imData[im]
            this.mergeRt(src,imn,rtData,exIds)
        }
    }
    private mergeRt(src:string,im:number,rtData:MsRtData,exIds:string[]){
        for (let rt in rtData){
            let rtn = Number.parseFloat(rt);
            let mzData = rtData[rt];
            this.mergeMz(src,im,rtn,mzData,exIds);
        }
    }
    private mergeMz(src:string,im:number,rt:number,mzData:MsMzData,exIds:string[]){
        for (let mz in mzData){
            let mzn = Number.parseFloat(mz);
            let ms2Data = mzData[mz];
            this.mergems2(src,im,rt,mzn,ms2Data,exIds);
        }
    }
    private mergems2(src:string,im:number,rt:number,mz:number,ms2Data:Msms2Data,exIds:string[]){
        for (let ms2 in ms2Data){
            let ms2n = Number.parseFloat(ms2);
            let ab = ms2Data[ms2];
            this.mergeAb(src,im,rt,mz,ms2n,ab,exIds);
        }
    }
    private mergeAb(src:string,im:number,rt:number,mz:number,ms2:number,ab:number[],exIds:string[]){
        for (let idx in ab){
            this.add(exIds[idx],src,rt,im,mz,ab[idx])
        }
    }
    stats():{nExamples:number,nFeatures:number,nFeatureValues:number}{
        let accum = {nExamples:this.exampleIdList.length,nFeatures:0,nFeatureValues:0};
        this.accumSrc(this.data,accum);
        return accum;
    }
    private accumSrc(data:MsData,accum:{nExamples:number,nFeatures:number,nFeatureValues:number}){
        for (let src in data){
            this.accumIm(data[src],accum);
        }
    }
    private accumIm(imData:MsImData,accum:{nExamples:number,nFeatures:number,nFeatureValues:number}){
        for (let im in imData){
            this.accumRt(imData[im],accum)
        }
    }
    private accumRt(rtData:MsRtData,accum:{nExamples:number,nFeatures:number,nFeatureValues:number}){
        for (let rt in rtData){
            this.accumMz(rtData[rt],accum)
        }
    }
    private accumMz(mzData:MsMzData,accum:{nExamples:number,nFeatures:number,nFeatureValues:number}){
        for (let mz in mzData){
            this.accumms2(mzData[mz],accum);
        }
    }
    private accumms2(ms2Data:Msms2Data,accum:{nExamples:number,nFeatures:number,nFeatureValues:number}){
        for (let ms2 in ms2Data){
            this.accumAb(ms2Data[ms2],accum)
        }
    }
    private accumAb(ab:number[],accum:{nExamples:number,nFeatures:number,nFeatureValues:number}){
        accum.nFeatures++;
        for (let n of ab){
            if (n && n>0)
                accum.nFeatureValues++;
        }
    }
        
}
export type MsFeature = {
    srcId:string,
    im:number,
    rt:number,
    mz:number,
    abs:number[],
    exIds:string[]}
type MsData = {[srcId:string]:MsImData}
type MsImData = {[imQuantum:number]:MsRtData}
type MsRtData = {[rtQuantum:number]:MsMzData}
type MsMzData = {[mzQuantum:number]:Msms2Data}
type Msms2Data = {[ms2Quantum:number]:number[]} // indexed by exampleIdx
export type MsRecord = {
    exId:string,
    srcId:string,
    im:number,
    rt:number,
    mz:number,
    ab:number,
    ms2:number
}
class MSDBufferFile {
    private file:FilesFS;
    private buffer:string="";
    private bufferLimit:number;
    constructor(file:FilesFS,bufferLimit=100000){
        this.file=file;
        this.bufferLimit=bufferLimit;
    }
    writelnSync(str:string){
        this.buffer+=str+"\n";
        if (this.buffer.length>this.bufferLimit){
            this.file.writeSync(this.buffer)
            this.buffer="";
        }
    }
    async close():Promise<void>{
        if (this.buffer.length>0)
            this.file.writeSync(this.buffer)
        await this.file.close();
        this.buffer="";
    }
        
}