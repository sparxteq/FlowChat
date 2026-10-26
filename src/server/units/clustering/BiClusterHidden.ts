import { ClusterTree } from "./BiClusterFramework";

export class BiClusterHidden {
    clusterTrees: Map<string, ClusterTree>;
    hiddenNodes: Map<string, BiClusterHiddenNode>;
    drawTrees: Map<string, ClusterTree>;
    drawLeafNodes: Map<string, number[]>;
    drawHiddenLeafRanges: Map<string, BiClusterHiddenRange[]>;
    constructor() {
        this.clusterTrees = new Map<string, ClusterTree>();
        this.hiddenNodes = new Map<string, BiClusterHiddenNode>();
        this.drawTrees = new Map<string, ClusterTree>();
        this.drawLeafNodes = new Map<string, number[]>();
        this.drawHiddenLeafRanges = new Map<string, BiClusterHiddenRange[]>();
    }
    setClusterTree(region: string, ct: ClusterTree): void {
        this.clusterTrees.set(region, ct);
        this.setDrawTree(region, ct);
    }
    clearHidden(region: string): void {
        let nodes = [...this.hiddenNodes.values()].filter(node => node.region === region);
        for (let node of nodes) {
            this.hiddenNodes.delete(node.hiddenNode!.id);
        }
        this.calcHiddenLeafRanges(region);
    }
    addNode(node: BiClusterHiddenNode) {
        if (!node.hiddenNode) {
            return;
        }
        this.hiddenNodes.set(node.hiddenNode.id, node);
        this.calcHiddenLeafRanges(node.region);
    }
    remNode(ct: ClusterTree) {
        if (this.hiddenNodes.has(ct.id)) {
            let node = this.hiddenNodes.get(ct.id)!;
            this.hiddenNodes.delete(ct.id);
            this.calcHiddenLeafRanges(node.region);
        }
    }
    find(ct: ClusterTree): BiClusterHiddenNode | null {
        if (this.hiddenNodes.has(ct.id)) {
            return this.hiddenNodes.get(ct.id)!;
        }
        else {
            return null;
        }
    }
    setDrawTree(region: string, ct: ClusterTree): void {
        this.drawTrees.set(region, ct);
        this.calcDrawLeafNodes(region);
        this.calcHiddenLeafRanges(region);
    }
    private calcDrawLeafNodes(region: string): void {
        if (this.drawTrees.has(region)) {
            let regionDrawTree = this.drawTrees.get(region)!;
            this.drawLeafNodes.set(region, regionDrawTree.leftToRight());
        }
    }
    private calcHiddenLeafRanges(region: string): void {
        if (!this.drawTrees.has(region)) {
            return;
        }
        // Create ranges for each hidden node.
        let drawTree = this.drawTrees.get(region)!;
        let drawNodes = drawTree.allNodes();
        let drawLeafNodes = this.drawLeafNodes.get(region)!;
        let hiddenNodes = [...this.hiddenNodes.values()].filter(node => node.region === region);

        let drawHiddenLeafRanges: BiClusterHiddenRange[] = [];
        for (let node of hiddenNodes) {
            if (drawNodes.find((n) => n.id === node.hiddenNode!.id)) {
                let first = drawLeafNodes.indexOf(node.leaves[0]);
                console.assert(first >= 0);
                let last = (first + node.leaves.length - 1);
                drawHiddenLeafRanges.push({ region: node.region, firstLeafIndex: first, lastLeafIndex: last });
            }
        }
        // Remove subset ranges.
        for (let i = 0; i < drawHiddenLeafRanges.length; i++) {
            let range = drawHiddenLeafRanges[i];
            for (let j = 0; j < drawHiddenLeafRanges.length; j++) {
                if (j !== i) {
                    let range2 = drawHiddenLeafRanges[j];
                    console.assert(range.region === range2.region);
                    if (range.firstLeafIndex >= range2.firstLeafIndex && range.lastLeafIndex <= range2.lastLeafIndex) {
                        drawHiddenLeafRanges.splice(i, 1);
                        i--;
                        break;
                    }
                }
            }
        }
        // Sort ranges.
        drawHiddenLeafRanges.sort((a, b) => {
            if (a.region < b.region) return -1;
            if (a.region > b.region) return 1;
            return a.firstLeafIndex - b.firstLeafIndex;
        });

        this.drawHiddenLeafRanges.set(region, drawHiddenLeafRanges);
    }
}
type BiClusterHiddenNode = {
    region: string,
    hiddenNode: ClusterTree,
    leaves: number[],
}
type BiClusterHiddenRange = {
    region: string,
    firstLeafIndex: number,
    lastLeafIndex: number,
}
