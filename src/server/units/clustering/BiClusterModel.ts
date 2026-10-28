import { Cluster, ClusterTree } from "./BiClusterFramework";
import { VectorCluster } from "./VectorCluster"

export class BiClusterModel {
    private baseMatrix: number[][] = [];
    private normalMatrix: number[][] = [];
    xClassName: string = "VectorCluster";
    yClassName: string = "VectorCluster";
    xIndexes: number[]=[];
    yIndexes: number[]=[];
    context: { [key: string]: any } = {}; // extra data needed by regions.
    getBaseMatrix(): number[][] {
        return this.baseMatrix;
    }
    getNormalMatrix(): number[][] {
        return this.normalMatrix;
    }
    addValue(x: number, y: number, v: number) {
        if (!this.baseMatrix[x])
            this.baseMatrix[x] = [];
        this.baseMatrix[x][y] = v;
    }
    normalizeX(log = false) { // if log==true then the base will be the logarithms of the values
        if (this.normalMatrix.length == 0) {
            for (let x = 0; x < this.baseMatrix.length; x++) {
                const row: number[] = [];
                for (let y = 0; y < this.baseMatrix[x].length; y++) {
                    if (log) {
                        row.push(Math.log(this.baseMatrix[x][y] + 2));
                    } else {
                        row.push(this.baseMatrix[x][y]);
                    }
                }
                this.normalMatrix.push(row);
            }
        }
        for (let x = 0; x < this.normalMatrix.length; x++) {
            let meanSum = 0;
            for (let y = 0; y < this.normalMatrix[x].length; y++) {
                let v = this.normalMatrix[x][y];
                meanSum += v;
            }
            let mean = meanSum / this.normalMatrix[x].length;
            for (let y = 0; y < this.normalMatrix[x].length; y++) {
                this.normalMatrix[x][y] -= mean;
            }
        }
        for (let x = 0; x < this.normalMatrix.length; x++) {
            let sumDiff2 = 0;
            for (let y = 0; y < this.normalMatrix[x].length; y++) {
                let v = this.normalMatrix[x][y]
                sumDiff2 += v * v;
            }
            let sd = Math.sqrt(sumDiff2);
            for (let y = 0; y < this.normalMatrix[x].length; y++) {
                this.normalMatrix[x][y] /= sd;
            }
        }
    }
    normalizeY(log = false) { // if log==true then the base will be the logarithms of the values
        if (this.normalMatrix.length == 0) {
            for (let x = 0; x < this.baseMatrix.length; x++) {
                const row: number[] = [];
                for (let y = 0; y < this.baseMatrix[x].length; y++) {
                    if (log) {
                        row.push(Math.log(this.baseMatrix[x][y] + 2));
                    } else {
                        row.push(this.baseMatrix[x][y]);
                    }

                }
                this.normalMatrix.push(row);
            }
        }
        for (let y = 0; y < this.normalMatrix[0].length; y++) {
            let meanSum = 0;
            for (let x = 0; x < this.normalMatrix.length; x++) {
                meanSum += this.normalMatrix[x][y];
            }
            let mean = meanSum / this.normalMatrix.length;
            for (let x = 0; x < this.normalMatrix.length; x++) {
                this.normalMatrix[x][y] -= mean;
            }
        }
        for (let y = 0; y < this.normalMatrix[0].length; y++) {
            let sumDiff2 = 0;
            for (let x = 0; x < this.normalMatrix.length; x++) {
                let v = this.normalMatrix[x][y]
                sumDiff2 += (v * v);
            }
            let sd = Math.sqrt(sumDiff2);
            if (sd>0){
                for (let x = 0; x < this.normalMatrix.length; x++) {
                    this.normalMatrix[x][y] /= sd;
                }
            }
        }
    }
    clearNormal() {
        this.normalMatrix = [];
    }
    isNormalized(): boolean {
        if (this.normalMatrix.length > 0)
            return true;
        else
            return false;
    }
    maxX(): number {
        if (this.xIndexes) {
            return this.xIndexes.length;
        }
        return this.baseMatrix.length;
    }
    maxY(): number {
        if (this.yIndexes) {
            return this.yIndexes.length;
        }
        return this.baseMatrix[0].length;
    }
    getNormalValue(x: number, y: number): number {
        if (this.normalMatrix.length == 0) {
            return this.baseMatrix[x][y];
        }
        return this.normalMatrix[x][y];
    }
    getNormalArrangedValue(x: number, y: number): number {
        let originalX = this.xIndexes[x];
        let originalY = this.yIndexes[y];
        return this.getNormalValue(originalX, originalY);
    }
    getValue(x: number, y: number): number {
        return this.baseMatrix[x][y];
    }
    getArrangedValue(x: number, y: number): number {
        let originalX = this.xIndexes[x];
        let originalY = this.yIndexes[y];
        return this.getValue(originalX, originalY);
    }
    arrangeX(indexes: number[]) {
        this.xIndexes = indexes;
    }
    arrangeY(indexes: number[]) {
        this.yIndexes = indexes;
    }
    xVector(x: number): number[] {
        if (this.isNormalized())
            return this.normalMatrix[x];
        else
            return this.baseMatrix[x];
    }
    yVector(y: number): number[] {
        let tmpArray: number[] = [];
        if (this.isNormalized()) {
            for (let i = 0; i < this.normalMatrix.length; i++) {
                tmpArray.push(this.normalMatrix[i][y]);
            }
        }
        else {
            for (let i = 0; i < this.baseMatrix.length; i++) {
                tmpArray.push(this.baseMatrix[i][y]);
            }
        }
        return tmpArray;
    }
    xClusterMean(idx: number[], whichMatrix: "base" | "normal"): number[] {
        let matrix: number[][];
        if (whichMatrix == "base") {
            matrix = this.baseMatrix;
        } else {
            matrix = this.normalMatrix;
        }
        let xMeanArray: number[] = [];
        for (let yi = 0; yi < this.maxY(); yi++) {
            let y = yi;
            if (this.yIndexes) {
                y = this.yIndexes[yi];
            }
            let sum = 0;
            for (let xi = 0; xi < idx.length; xi++) {
                let x = idx[xi];
                sum += matrix[x][y];
            }
            let mean = sum / idx.length;
            xMeanArray.push(mean);
        }
        return xMeanArray;
    }
    yClusterMean(idx: number[], whichMatrix: "base" | "normal"): number[] {
        let matrix: number[][];
        if (whichMatrix == "base") {
            matrix = this.baseMatrix;
        } else {
            matrix = this.normalMatrix;
        }
        let yMeanArray: number[] = [];
        for (let xi = 0; xi < this.maxX(); xi++) {
            let x = xi;
            if (this.xIndexes) {
                x = this.xIndexes[xi];
            }
            let sum = 0;
            for (let yi = 0; yi < idx.length; yi++) {
                let y = idx[yi];
                sum += matrix[x][y];
            }
            let mean = sum / idx.length;
            yMeanArray.push(mean);
        }
        return yMeanArray;
    }
    public xBaseClusterTree?: ClusterTree;
    public xDrawClusterTree?: ClusterTree;
    public yBaseClusterTree?: ClusterTree;
    public yDrawClusterTree?: ClusterTree;
    public xItemDescriptions: string[] = [];
    private _xCluster?: Cluster;
    private _yCluster?: Cluster;
    getXItemDescription(itemNum: number): string {
        return this.xItemDescriptions[itemNum];
    }
    setXItemDescription(itemNum: number, description: string) {
        this.xItemDescriptions[itemNum] = description;
    }
    xClusteredTree(): ClusterTree {
        if (!this.xBaseClusterTree) {
            let vc = VectorCluster.makeNew(this.xClassName);
            for (let itemNum = 0; itemNum < this.xItemDescriptions.length; itemNum++) {
                vc.setItemDescription(itemNum, this.xItemDescriptions[itemNum]);
            }
            for (let i = 0; i < this.baseMatrix.length; i++) {
                vc.addVector(this.xVector(i));
            }
            this.xBaseClusterTree = vc.clusterTree();
            this.arrangeX(this.xBaseClusterTree.leftToRight());
            this.xDrawClusterTree = this.xBaseClusterTree;
            this._xCluster = vc;
        }
        return this.xDrawClusterTree!;
    }
    xCluster(): Cluster {
        if (!this._xCluster) {
            let vc = VectorCluster.makeNew(this.xClassName);
            for (let itemNum = 0; itemNum < this.xItemDescriptions.length; itemNum++) {
                vc.setItemDescription(itemNum, this.xItemDescriptions[itemNum]);
            }
            for (let i = 0; i < this.baseMatrix.length; i++) {
                vc.addVector(this.xVector(i));
            }
            vc.loadDistances();
            this._xCluster = vc;
        }
        return this._xCluster;
    }
    zoomXCluster(ct: ClusterTree) {
        this.xDrawClusterTree = ct;
        let arrange = ct.leftToRight();
        this.arrangeX(arrange);
    }
    zoomOutXCluster() {
        this.xDrawClusterTree = this.xBaseClusterTree;
        let arrange = this.xDrawClusterTree!.leftToRight();
        this.arrangeX(arrange);
    }
    yItemDescriptions: string[] = [];
    getYItemDescription(itemNum: number): string {
        return this.yItemDescriptions[itemNum];
    }
    setYItemDescription(itemNum: number, description: string) {
        this.yItemDescriptions[itemNum] = description;
    }
    yClusteredTree(): ClusterTree {
        if (!this.yBaseClusterTree) {
            let vc = VectorCluster.makeNew(this.yClassName);
            for (let itemNum = 0; itemNum < this.yItemDescriptions.length; itemNum++) {
                vc.setItemDescription(itemNum, this.yItemDescriptions[itemNum]);
            }
            for (let i = 0; i < this.baseMatrix[0].length; i++) {
                vc.addVector(this.yVector(i));
            }
            this.yBaseClusterTree = vc.clusterTree();
            this.arrangeY(this.yBaseClusterTree.leftToRight());
            this.yDrawClusterTree = this.yBaseClusterTree;
            this._yCluster = vc;
        }
        return this.yDrawClusterTree!;
    }
    yCluster(): Cluster {
        if (!this._yCluster) {
            let vc = VectorCluster.makeNew(this.yClassName);
            for (let itemNum = 0; itemNum < this.yItemDescriptions.length; itemNum++) {
                vc.setItemDescription(itemNum, this.yItemDescriptions[itemNum]);
            }
            for (let i = 0; i < this.baseMatrix[0].length; i++) {
                vc.addVector(this.yVector(i));
            }
            vc.loadDistances();
            this._yCluster = vc;
        }
        return this._yCluster;
    }
    zoomYCluster(ct: ClusterTree) {
        this.yDrawClusterTree = ct;
        let arrange = ct.leftToRight();
        this.arrangeY(arrange);
    }
    zoomOutYCluster() {
        this.yDrawClusterTree = this.yBaseClusterTree;
        let arrange = this.yDrawClusterTree!.leftToRight();
        this.arrangeY(arrange);
    }
    setXAlgorithm(className: string) {
        this.xClassName = className;
    }
    setYAlgorithm(className: string) {
        this.yClassName = className;
    }
    vMax(): number {
        let matrix: number[][] = [];
        if (this.normalMatrix.length > 0)
            matrix = this.normalMatrix;
        else
            matrix = this.baseMatrix;
        let vMax = Number.MIN_VALUE;
        for (let x = 0; x < matrix.length; x++) {
            for (let y = 0; y < matrix[x].length; y++) {
                if (matrix[x][y] > vMax) {
                    vMax = matrix[x][y];
                }
            }
        }
        return vMax;
    }
    vMin(): number {
        let matrix: number[][] = [];
        if (this.normalMatrix.length > 0)
            matrix = this.normalMatrix;
        else
            matrix = this.baseMatrix;
        let vMin = Number.MAX_VALUE;
        for (let x = 0; x < matrix.length; x++) {
            for (let y = 0; y < matrix[x].length; y++) {
                if (matrix[x][y] < vMin) {
                    vMin = matrix[x][y];
                }
            }
        }
        return vMin;
    }
    vBaseMax(): number {
        let vMax = Number.MIN_VALUE;
        for (let x = 0; x < this.baseMatrix.length; x++) {
            for (let y = 0; y < this.baseMatrix[x].length; y++) {
                if (this.baseMatrix[x][y] > vMax) {
                    vMax = this.baseMatrix[x][y];
                }
            }
        }
        return vMax;
    }
    vBaseMin(): number {
        let vMin = Number.MAX_VALUE;
        for (let x = 0; x < this.baseMatrix.length; x++) {
            for (let y = 0; y < this.baseMatrix[x].length; y++) {
                if (this.baseMatrix[x][y] < vMin) {
                    vMin = this.baseMatrix[x][y];
                }
            }
        }
        return vMin;
    }
    setHeatColors(neg: number, zero: number, pos: number) {
        for (let x = 0; x < this.baseMatrix.length; x++) {
            for (let y = 0; y < this.baseMatrix[x].length; y++) {
                if (this.baseMatrix[x][y] > 0) {
                    let g = ((this.baseMatrix[x][y] - this.vMin()) / (this.vMax() - this.vMin())) * (pos - zero) + zero;
                }
                else if (this.baseMatrix[x][y] < 0) {
                    let r = ((this.baseMatrix[x][y] - this.vMin()) / (this.vMax() - this.vMin())) * (neg - zero) + zero;
                }
            }
        }
    }
    xItemInfo: ItemInfo[] = [];
    setXInfo(idx: number, info: ItemInfo) {
        this.xItemInfo[idx] = info;
    }
    getXInfo(idx: number): ItemInfo {
        return this.xItemInfo[idx];
    }
    yItemInfo: ItemInfo[] = [];
    setYInfo(idx: number, info: ItemInfo) {
        this.yItemInfo[idx] = info;
    }
    getYInfo(idx: number): ItemInfo {
        return this.yItemInfo[idx];
    }
    toJSON(): any {
        let xbct;
        if (this.xBaseClusterTree) {
            xbct = this.xBaseClusterTree.toJSON();
        }
        let xdct;
        if (this.xDrawClusterTree) {
            xdct = this.xDrawClusterTree.toJSON();
        }
        let ybct;
        if (this.yBaseClusterTree) {
            ybct = this.yBaseClusterTree.toJSON();
        }
        let ydct;
        if (this.yDrawClusterTree) {
            ydct = this.yDrawClusterTree.toJSON();
        }
        let rslt = {
            mat: this.baseMatrix,
            nor: this.normalMatrix,
            xcl: this.xClassName,
            ycl: this.yClassName,
            xi: this.xIndexes,
            yi: this.yIndexes,
            xbct: xbct,
            xdct: xdct,
            ybct: ybct,
            ydct: ydct,
            xid: this.xItemDescriptions,
            yid: this.yItemDescriptions,
            xii: this.xItemInfo,
            yii: this.yItemInfo
        }
        return rslt;
    }
    fromJSON(json: any) {
        this.baseMatrix = json.mat;
        this.normalMatrix = json.nor;
        this.xClassName = json.xcl;
        this.yClassName = json.ycl;
        this.xIndexes = json.xi;
        this.yIndexes = json.yi;
        if (json.xbct) {
            this.xBaseClusterTree = new ClusterTree();
            this.xBaseClusterTree.fromJSON(json.xbct);
        }
        if (json.xdct) {
            this.xDrawClusterTree = new ClusterTree();
            this.xDrawClusterTree.fromJSON(json.xdct);
        }
        if (json.ybct) {
            this.yBaseClusterTree = new ClusterTree();
            this.yBaseClusterTree.fromJSON(json.ybct);
        }
        if (json.ydct) {
            this.yDrawClusterTree = new ClusterTree();
            this.yDrawClusterTree.fromJSON(json.ydct);
        }
        this.xItemDescriptions = json.xid;
        this.yItemDescriptions = json.yid;
        this.xItemInfo = json.xii;
        this.yItemInfo = json.yii;
    }
}
type ItemInfo = { [fieldId: string]: number | string | string[] }