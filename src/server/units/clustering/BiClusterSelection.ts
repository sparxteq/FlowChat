

import { ClusterTree } from "./BiClusterFramework";
import { BiClusterDrawRegion } from "./BiClusterDrawRegion"
type BiClusterSelChangeType = string;

export class BiClusterSelection {
    selections: Map<ClusterTree, BiClusterSel> = new Map<ClusterTree, BiClusterSel>();
    prelimSelections: Map<ClusterTree, BiClusterSel> = new Map<ClusterTree, BiClusterSel>();
    prelimSelectRect: { x: number, y: number, width: number, height: number } | undefined;
    yClusters?: BiClusterDrawRegion;
    xClusters?: BiClusterDrawRegion;
    heatMap?: BiClusterDrawRegion;
    detailSelections: Map<string, ClusterTree> = new Map<string, ClusterTree>();
    listeners: ((changes: BiClusterSelChangeType[]) => void)[] = [];
    addListener(listener: (changes: BiClusterSelChangeType[]) => void) {
        this.listeners.push(listener);
    }
    notifyListeners(changes: BiClusterSelChangeType[]) {
        for (let listener of this.listeners) {
            listener(changes);
        }
    }
    addSelection(selection: BiClusterSel) {
        if (!selection.clusterTree) {
            return;
        }
        this.selections.set(selection.clusterTree, selection);
        let color = this.pickColor(selection.region);
        selection.color = color;
        this.notifyListeners([`select-${selection.region}`]);
    }
    remSelection(ct: ClusterTree) {
        if (this.selections.has(ct)) {
            let sel = this.selections.get(ct)!;
            this.selections.delete(ct);
            this.notifyListeners([`select-${sel.region}`]);
        }
    }
    addPreliminarySelection(selection: BiClusterSel) {
        if (!selection.clusterTree) {
            return;
        }
        this.prelimSelections.set(selection.clusterTree, selection);
        this.notifyListeners([`prelim-select-${selection.region}`]);
    }
    remPreliminarySelection(ct: ClusterTree) {
        if (this.prelimSelections.has(ct)) {
            let sel = this.prelimSelections.get(ct)!;
            this.prelimSelections.delete(ct);
            this.notifyListeners([`prelim-select-${sel.region}`]);
        }
    }
    setDetailSelection(region: string, ct: ClusterTree) {
        this.detailSelections.set(region, ct);
        this.notifyListeners([`detail-select-${region}`]);
    }
    getDetailSelection(region: string): ClusterTree | undefined {
        return this.detailSelections.get(region);
    }
    private static colorList = ["blue", "orange", "purple", "teal", "orchid", "tan", "sienna", "yellow"];
    pickColor(region: string): string {
        for (let cNum = 0; cNum < BiClusterSelection.colorList.length; cNum++) {
            let found = false;
            for (let sel of this.selections.values()) {
                if (sel.region == region) {
                    if (sel.color == BiClusterSelection.colorList[cNum]) {
                        found = true
                        break;
                    }
                }
            }
            if (!found) {
                return BiClusterSelection.colorList[cNum]
            }
        }
        return "black";
    }
    inSelections(ct: ClusterTree): BiClusterSel | null {
        return this.selections.get(ct) || null;
    }
    inPreliminarySelections(ct: ClusterTree): BiClusterSel | null {
        return this.prelimSelections.get(ct) || null;
    }
    clear(region: string) {
        let regionSelections = [...this.selections.values()].filter(sel => sel.region === region);
        for (let sel of regionSelections) {
            this.selections.delete(sel.clusterTree!);
        }
        this.notifyListeners([`select-${region}`]);
    }
    clearPreliminarySelections() {
        this.prelimSelections.clear();
        this.prelimSelectRect = undefined;
        this.notifyListeners([`prelim-select`]);
    }
    clearDetailSelection(region: string) {
        this.detailSelections.delete(region);
        this.notifyListeners([`detail-select-${region}`]);
    }
}
type BiClusterSel = {
    region: string,
    clusterTree?: ClusterTree,
    color?: string
}