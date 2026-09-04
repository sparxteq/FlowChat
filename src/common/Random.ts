



function random(seed: number): () => number { // mulberry32
    let a = seed >>> 0;

    return () => {
        a += 0x6D2B79F5;
        let t = Math.imul(a ^ (a >>> 15), a | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function randomInt(seed:number,min:number,max:number):()=>number {
    let mul = random(seed)
    return ():number=>{
        let rnd = mul();
        return Math.floor(rnd*(max-min+1))+min
    }
}

export function randomF(seed:number,min=0,max=1):()=>number {
    let mul=random(seed);
    return ():number=>{
        let rnd = mul();
        return rnd*(max-min)+min;
    }
}