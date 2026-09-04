


export class MSSelectSieve {
    private incomingQuanta:MSSieveData;
    
    constructor(incomingQuanta:MSSieveData){
        this.incomingQuanta=incomingQuanta

    }
    private sieve:MSSieve={}
    addInBucket(bIn:MSSieveData){
        let b:MSSieveData = {
            srcId:bIn.srcId,
            mz:this.quantize(bIn.mz,this.incomingQuanta.mz),
            rt:this.quantize(bIn.rt,this.incomingQuanta.rt),
            im:this.quantize(bIn.im,this.incomingQuanta.im),
            ms2:this.quantize(bIn.ms2,this.incomingQuanta.ms2),
        }
        let srcSieve = this.sieve;
        if (!srcSieve[b.srcId])
            srcSieve[b.srcId]={}
        let mzSieve = srcSieve[b.srcId];
        if (!mzSieve[b.mz])
            mzSieve[b.mz]={};
        let rtSieve = mzSieve[b.mz]
        if (!rtSieve[b.rt])
            rtSieve[b.rt]={}
        let imSieve = rtSieve[b.rt]
        if (!imSieve[b.im])
            imSieve[b.im]={}
        let ms2Sieve = imSieve[b.im]
        if (!ms2Sieve){
            ms2Sieve={}
            imSieve[b.im]=ms2Sieve
        }
        ms2Sieve[b.ms2]=true;
    }
    accept(data:MSSieveData):boolean{
        let d = this.dataQuantize(data,this.incomingQuanta);
        let srcSieve = this.sieve;
        if (!srcSieve[d.srcId]) return false;
        let mzSieve = srcSieve[d.srcId]
        if (!mzSieve[d.mz]) return false;
        let rtSieve = mzSieve[d.mz]
        if (!rtSieve[d.rt]) return false;
        let imSieve = rtSieve[d.rt]
        if (!imSieve[d.im]) return false;
        let ms2Sieve = imSieve[d.im];
        if (!ms2Sieve[d.ms2]) return false;
        return true;
    }
    dataQuantize(data:MSSieveData,quanta:MSSieveData):MSSieveData{
        let rslt:MSSieveData = {
            srcId:data.srcId,
            mz:this.quantize(data.mz,quanta.mz),
            rt:this.quantize(data.rt,quanta.rt),
            im:this.quantize(data.im,quanta.im),
            ms2:this.quantize(data.ms2,quanta.ms2),
        }
        return rslt;
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
}
export type MSSieveData = {
    srcId:string,
    mz:number,
    rt:number,
    im:number,
    ms2:number
}
type MSSieve = SRCSieve;
type SRCSieve = {[srcId:string]:MZSieve};
type MZSieve = { [mz:number]:RTSieve}
type RTSieve = { [rt:number]:IMSieve}
type IMSieve = { [im:number]:MS2Sieve}
type MS2Sieve = { [ms2:number]:boolean}