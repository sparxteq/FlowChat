import { Log } from "../../client/log/Log";
import { ZCode, ZCodeSpec, ZField, ZString, ZNumber } from "../../common/ZT";
import { FilesFS } from "../files/FilesFS";
import { MSSelectSieve } from "../MZML/MSSelectSieve";
import { MassSpecData } from "./MassSpecData";
import { WriteTable } from "./WriteTable";



const exCol=0;
const subCol=1;
const imCol=2;
const rtCol=3;
const mzCol=4;
const abCol=5;
export class WriteTableZMS extends WriteTable{
    data?:MassSpecData;
    setQuanta(rtQuantum:number,imQuantum:number,mzQuantum:number){
        this.data = new MassSpecData(rtQuantum,imQuantum,mzQuantum)
        if (this.sieve)
            this.data.setSieve(this.sieve);
    }
    private sieve?:MSSelectSieve
    setSieve(sieve:MSSelectSieve){
        this.sieve=sieve;
        if (this.data)
            this.data.setSieve(sieve);
    }
    addOutCome(exampleId:string,outcome:string){
        this.data?.addOutcome(exampleId,outcome);
    }
    getExtension(): string {
        return "zms";
    }
    protected file?:FilesFS;
    private isOpen=false;
    async openW(): Promise<void> {
        if (!this.data){
            throw `quanta not initialized by calling setQuanta`
        }
        if (this.isOpen)
            return;
        this.isOpen=true;
        this.file = new FilesFS(this.fullSourceId);
        if (this.file){
            await this.file.openW(false)
        }
    }
    private async writeColHeaders():Promise<void>{
        let exCode = new ZCode()
        let codes:ZCodeSpec[]=[]
        let data = <MassSpecData>this.data;
        for (let exIdx=0;exIdx<data.exampleIdList.length;exIdx++){
            let exId = data.exampleIdList[exIdx]
            let zcs = new ZCodeSpec(exIdx,exId)
            codes.push(zcs);
        }
        exCode.codes=codes;
        exCode.info.outcomes=data.outcomes;
        let exHead = new ZField("exampleId",exCode,{desc:"example id"})
        let subHead = new ZField("srcId",new ZString(),{desc:"srcId"})
        let imHead = new ZField("im",new ZNumber(),{desc:"ion mobility",quantum:this.data?.imQuantum})
        let rtHead = new ZField("rt",new ZNumber(),{desc:"retention time",quantum:this.data?.rtQuantum})
        let mzHead = new ZField("mz",new ZNumber(),{desc:"mass/charge",quantum:this.data?.mzQuantum})
        let abHead = new ZField("ab",new ZNumber(),{desc:"abundance"});
        let cols = [exHead.toJSON(),
            subHead.toJSON(),
            imHead.toJSON(),
            rtHead.toJSON(),
            mzHead.toJSON(),
            abHead.toJSON()];
        let str = JSON.stringify(cols);
        if (this.file){
            await this.file.writeln(str)
        }
    }
    wtp?:Log
    async close(): Promise<void> {
        if (this.file){
            if (!this.isOpen)
                await this.openW();
            
            await this.writeColHeaders()
            await this.data?.writeData(this.file,this.wtp);
            await this.file.close();
            this.file=undefined;
            this.isOpen=false;
        };
    }
    
    addRow(v: any[]): void {
        this.data?.add(v[exCol],v[subCol],v[rtCol],v[imCol],v[mzCol],v[abCol]);
    }
    addRec(exId:string,srcId:string,rt:number,im:number,mz:number,ab:number):void{
        this.data?.add(exId,srcId,rt,im,mz,ab);
    }
    
    stats():{nExamples:number,nFeatures:number,nFeatureValues:number}{
        if (this.data){
            return this.data.stats();
        } else {
            return {nExamples:0,nFeatures:0,nFeatureValues:0}
        }
    }
}