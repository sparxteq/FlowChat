import { Cluster, ClusterTree } from "./BiClusterFramework";


export class VectorCluster extends Cluster {
    private items: number[][] = [];
    private metric: "euclid" | "manhattan" = "euclid";
    addVector(vector: number[]) {
        this.items.push(vector);
    }
    nItems(): number {
        return this.items.length;
    }
    setMetric(metric: "euclid" | "manhattan") {
        this.metric = metric;
    }
    distance(item1: number, item2: number): number {
        let a = this.items[item1];
        let b = this.items[item2];
        let sum = 0;
        switch (this.metric) {
            case "euclid":
                for (let i = 0; i < a.length; i++) {
                    let dist = (a[i] - b[i]) * (a[i] - b[i]);
                    sum = sum + dist;
                }
                return Math.sqrt(sum);
            case "manhattan":
                for (let i = 0; i < a.length; i++) {
                    let dist = Math.abs(a[i] - b[i]);
                    sum = sum + dist;
                }
                return sum;
        }
    }
    normalize() {
        for (let i = 0; i < this.items.length; i++) {
            this.normalizeVector(this.items[i]);
        }
    }
    private normalizeVector(vector: number[]) {
        let sum = 0;
        switch (this.metric) {
            case "euclid":
                for (let i = 0; i < vector.length; i++) {
                    sum = sum + (vector[i] * vector[i]);
                }
                let sqrt = Math.sqrt(sum);
                for (let i = 0; i < vector.length; i++) {
                    vector[i] /= sqrt;
                }
                return;
            case "manhattan":
                for (let i = 0; i < vector.length; i++) {
                    sum = sum + vector[i];
                }
                for (let i = 0; i < vector.length; i++) {
                    vector[i] = vector[i] / sum;
                }
                return;
        }
    }
    private itemDescriptions: string[] = [];
    setItemDescription(itemNum: number, description: string) {
        this.itemDescriptions[itemNum] = description;
    }
    description(itemNum: number): string {
        return this.itemDescriptions[itemNum];
    }
    protected mergeClusters(cl1: ClusterTree, cl2: ClusterTree): ClusterTree {
        let ct = super.mergeClusters(cl1, cl2);
        ct.description = "";
        for (let itemNum of cl1.items) {
            if (!ct.description || ct.description.length == 0) {
                ct.description = this.itemDescriptions[itemNum];
            } else {
                ct.description += ", " + this.itemDescriptions[itemNum];
            }
        }
        for (let itemNum of cl2.items) {
            if (!ct.description || ct.description.length == 0) {
                ct.description = this.itemDescriptions[itemNum];
            } else {
                ct.description += ", " + this.itemDescriptions[itemNum];
            }
        }
        return ct;
    }
    private static registry: { [className: string]: () => VectorCluster } = {}
    static register(name: string, factory: () => VectorCluster) {
        this.registry[name] = factory;
    }
    static makeNew(name: string): VectorCluster {
        let factory = this.registry[name];
        let obj = factory();
        return obj;
    }
}
VectorCluster.register("VectorCluster", () => new VectorCluster())