import { BiClusterSelection } from "./BiClusterSelection"
import { BiClusterHidden } from "./BiClusterHidden"
export abstract class Cluster {
  private distArray: number[][] = [];
  public loadDistances() {
    let nItems = this.nItems();
    for (let i = 0; i < nItems - 1; i++) {
      for (let j = i + 1; j < nItems; j++) {
        let dist = this.distance(i, j);
        if (!this.distArray[i]) {
          this.distArray[i] = [];
        }
        this.distArray[i][j] = dist;
      }
    }
  }
  maxItemDistance(): number {
    let maxDist = -1;
    for (let i = 0; i < this.distArray.length; i++) {
      for (let j = 0; j < this.distArray[i].length; j++) {
        if (this.distArray[i][j] > maxDist) {
          maxDist = this.distArray[i][j];
        }
      }
    }
    return maxDist;
  }
  abstract nItems(): number;
  abstract distance(item1: number, item2: number): number;
  abstract description(itemNum: number): string;
  clusterForest(): ClusterTree[] {
    this.loadDistances();
    let nItems = this.nItems();
    let clusterList: ClusterTree[] = [];
    for (let i = 0; i < nItems; i++) {
      clusterList.push(this.newLeaf(i));
    }
    let done = false
    while (!done && clusterList.length > 1) {
      let { a, b, check } = this.extractClosestForest(clusterList);
      if (check === 0) {
        clusterList.push(this.mergeClusters(a, b));
      } else {
        done = true;
      }
    }

    this.distArray = [];
    return clusterList;
  }
  clusterTree(): ClusterTree {
    this.loadDistances();
    let nItems = this.nItems();
    let clusterList: ClusterTree[] = [];
    for (let i = 0; i < nItems; i++) {
      clusterList.push(this.newLeaf(i));
    }
    while (clusterList.length > 1) {
      let { a, b } = this.extractClosest(clusterList);
      clusterList.push(this.mergeClusters(a, b));
    }

    this.distArray = [];
    return clusterList[0];
  }
  protected clusterDistanceMax(a: ClusterTree, b: ClusterTree): number {
    let maxDist = -1;
    for (let i = 0; i < a.items.length; i++) {
      for (let j = 0; j < b.items.length; j++) {
        let itemA = a.items[i];
        let itemB = b.items[j];
        if (itemB < itemA) {
          let temp = itemA;
          itemA = itemB;
          itemB = temp;
        }
        let distance = this.distArray[itemA][itemB];
        if (distance > maxDist) {
          maxDist = distance;
        }
      }
    }
    return maxDist;
  }
  protected clusterDistanceMin(a: ClusterTree, b: ClusterTree): number {
    let minDist = Number.MAX_VALUE;
    for (let i = 0; i < a.items.length; i++) {
      for (let j = 0; j < b.items.length; j++) {
        let itemA = a.items[i];
        let itemB = b.items[j];
        if (itemB < itemA) {
          let temp = itemA;
          itemA = itemB;
          itemB = temp;
        }
        let distance = this.distArray[itemA][itemB];
        if (distance < minDist) {
          minDist = distance;
        }
      }
    }
    return minDist;
  }
  protected clusterDistanceAve(a: ClusterTree, b: ClusterTree): number {
    let sumDist = 0;
    let cntDist = 0;
    for (let i = 0; i < a.items.length; i++) {
      for (let j = 0; j < b.items.length; j++) {
        let itemA = a.items[i];
        let itemB = b.items[j];
        if (itemB < itemA) {
          let temp = itemA;
          itemA = itemB;
          itemB = temp;
        }
        let distance = this.distArray[itemA][itemB];
        sumDist += distance;
        cntDist++;
      }
    }
    return sumDist / cntDist;
  }
  clusterDistanceAlg: "Maximum" | "Minimum" | "Average" = "Maximum";
  public clusterDistance(a: ClusterTree, b: ClusterTree): number {
    switch (this.clusterDistanceAlg) {
      case "Maximum": return this.clusterDistanceMax(a, b);
      case "Minimum": return this.clusterDistanceMin(a, b);
      case "Average": return this.clusterDistanceAve(a, b);
    }
  }
  private extractClosestForest(clusterList: ClusterTree[]): { a: ClusterTree, b: ClusterTree, check: number } {
    let minDist = Number.MAX_VALUE;
    let minaI: number = -1;
    let minbI: number = -1;
    //DB.msg("clusterDistAlg="+this.clusterDistanceAlg)
    for (let i = 0; i < clusterList.length - 1; i++) {
      let a = clusterList[i];
      for (let j = i + 1; j < clusterList.length; j++) {
        let b = clusterList[j];
        let dist = this.clusterDistance(a, b);
        if (dist < minDist) {
          minDist = dist;
          minaI = i;
          minbI = j;
        }
      }
    }
    if (minDist == Number.MAX_SAFE_INTEGER) {
      let a = clusterList[minaI];
      let b = clusterList[minbI];
      return { a: a, b: b, check: 1 };
    }
    let a = clusterList[minaI];
    let b = clusterList[minbI];
    clusterList.splice(minbI, 1);
    clusterList.splice(minaI, 1);
    return { a: a, b: b, check: 0 };
  }
  private extractClosest(clusterList: ClusterTree[]): { a: ClusterTree, b: ClusterTree, check: number } {
    let minDist = Number.MAX_VALUE;
    let minI: number = -1;
    let minJ: number = -1;
    //DB.msg("clusterDistAlg="+this.clusterDistanceAlg)
    for (let i = 0; i < clusterList.length - 1; i++) {
      let a = clusterList[i];
      for (let j = i + 1; j < clusterList.length; j++) {
        let b = clusterList[j];
        let dist = this.clusterDistance(a, b);
        if (dist < minDist) {
          minDist = dist;
          minI = i;
          minJ = j;
        }
      }
    }
    let a = clusterList[minI];
    let b = clusterList[minJ];
    clusterList.splice(minJ, 1);
    clusterList.splice(minI, 1);
    return { a: a, b: b, check: 0 };
  }
  protected newLeaf(item: number): ClusterTree {
    let cl = new ClusterTree();
    cl.items = [item];
    cl.description = this.description(item);
    return cl;
  }
  protected mergeClusters(cl1: ClusterTree, cl2: ClusterTree): ClusterTree {
    let newCluster = new ClusterTree();
    newCluster.left = cl1;
    newCluster.right = cl2;
    if (!cl1.items) {
      let a = 1;
    }
    newCluster.items = cl1.items.concat(cl2.items);
    return newCluster;
  }
}

export class ClusterTree {
  left: ClusterTree | undefined;
  right: ClusterTree | undefined;
  items: number[]=[];
  id: string;
  description: string="";

  constructor() {
    this.id = crypto.randomUUID();
  }

  depth(): number {
    if (!this.left && !this.right) {
      return 1;
    } else {
      let leftD = 0;
      let rightD = 0;
      if (this.left) {
        leftD = this.left.depth()
      }
      if (this.right) {
        rightD = this.right.depth();
      }

      return 1 + Math.max(leftD, rightD);
    }
  }
  isLeaf(): boolean {
    return !this.left && !this.right;
  }
  static drawVerticalForest(forest: ClusterTree[], g: CanvasRenderingContext2D, xMin: number, xMax: number,
    yMin: number, yMax: number, cellWidth: number, select: BiClusterSelection, hidden: BiClusterHidden,
    strokeStyle = "black") {
    let leafNum = 0;
    let treeStart = xMin;
    let treeEnd = 0;
    for (let i = 0; i < forest.length; i++) {
      let tree = forest[i];
      leafNum += tree.items.length;
    }
    let width = xMax - xMin;
    let leafWidth = width / leafNum;
    for (let i = 0; i < forest.length; i++) {
      let tree = forest[i];
      let treeWidth = leafWidth * tree.items.length;
      treeEnd = treeStart + treeWidth;
      tree.drawVertical(g, treeStart, treeEnd, yMin, yMax, cellWidth, select, hidden, strokeStyle);
      treeStart = treeEnd;
    }
  }
  egVerticalForest(forest: ClusterTree[], xPoint: number, yPoint: number, xMin: number, xMax: number,
    yMin: number, yMax: number, cellHeight: number, hidden: BiClusterHidden): ClusterTree | undefined {
    let leafNum = 0;
    let treeStart = xMin;
    let treeEnd = 0;
    for (let i = 0; i < forest.length; i++) {
      let tree = forest[i];
      leafNum += tree.items.length;
    }
    let width = xMax - xMin;
    let leafWidth = width / leafNum;
    for (let i = 0; i < forest.length; i++) {
      let tree = forest[i];
      let treeWidth = leafWidth * tree.items.length;
      treeEnd = treeStart + treeWidth;
      let eg = tree.egVertical(xPoint, yPoint, treeStart, treeEnd, yMin, yMax, cellHeight, hidden);
      if (eg) {
        return eg;
      }
      treeStart = treeEnd;
    }
  }
  drawVertical(g: CanvasRenderingContext2D, xMin: number, xMax: number,
    yMin: number, yMax: number, cellHeight: number, selection: BiClusterSelection, hidden: BiClusterHidden,
    selectStyle = "black"): number {
    g.lineWidth = 1;
    let levels = this.depth();
    let height = yMax - yMin + 1;
    let levelHeight = height / levels;
    let rootY = yMin;
    let rootX = xMin;

    let selected = selection.inSelections(this);
    if (selected) {
      selectStyle = <string>selected.color;
    }
    let prelimSelected = selection.inPreliminarySelections(this);
    let detailSelected = (this === selection.getDetailSelection("xCluster"));
    let hiddenNode = hidden.find(this);

    if (hiddenNode) {
      let L = Math.max(100 - hiddenNode.leaves.length * 10, 20);
      g.fillStyle = `hsl(195, 100%, ${L}%)`;
      g.fillRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1);
      rootX = (xMax - xMin) / 2 + xMin;
      if (selected) {
        this.drawSelectedV(g, rootX, rootY, selectStyle);
      }
      if (prelimSelected) {
        this.drawPrelimSelectedV(g, rootX, rootY, prelimSelected.color!);
      }
      if (detailSelected) {
        this.drawSelectedV(g, rootX, rootY, "red");
      }
      return rootX;
    } else {
      if (!this.left && !this.right) {
        rootX = (xMax - xMin) / 2 + xMin;
        g.strokeStyle = "black";
        g.beginPath();
        g.moveTo(rootX, yMin);
        g.lineTo(rootX, yMax);
        g.stroke();
        if (selected) {
          this.drawSelectedV(g, rootX, rootY, selectStyle);
        }
        if (prelimSelected) {
          this.drawPrelimSelectedV(g, rootX, rootY, prelimSelected.color!);
        }
        if (detailSelected) {
          this.drawSelectedV(g, rootX, rootY, "red");
        }
        return rootX;
      } else {
        let leftDesiredHeight = ClusterTree.desiredNodeHeight(this.left!, cellHeight, hidden);
        let rootX = xMin + leftDesiredHeight;
        g.strokeStyle = "black";
        g.beginPath();
        g.moveTo(rootX, rootY);
        g.lineTo(rootX, rootY + levelHeight);
        g.stroke();
        let a = this.left!.drawVertical(g, xMin, rootX, rootY + levelHeight, yMax,
          cellHeight, selection, hidden, selectStyle);
        let b = this.right!.drawVertical(g, rootX, xMax, rootY + levelHeight, yMax,
          cellHeight, selection, hidden, selectStyle);
        g.strokeStyle = "black";
        g.beginPath();
        g.moveTo(a, (rootY + levelHeight));
        g.lineTo(b, (rootY + levelHeight));
        g.stroke();
        if (selected) {
          this.drawSelectedV(g, rootX, rootY, selectStyle)
        }
        if (prelimSelected) {
          this.drawPrelimSelectedV(g, rootX, rootY, prelimSelected.color!);
        }
        if (detailSelected) {
          this.drawSelectedV(g, rootX, rootY, "red");
        }
        return rootX;
      }
    }
  }
  private drawSelectedV(g: CanvasRenderingContext2D, rootX:number, rootY:number, selectStyle: string) {
    let d = 6;
    g.fillStyle = selectStyle;
    g.beginPath();
    g.moveTo(rootX, rootY);
    g.lineTo(rootX + d, rootY + d);
    g.lineTo(rootX, rootY + d + d);
    g.lineTo(rootX - d, rootY + d);
    g.closePath();
    g.fill();
    g.strokeStyle = "black";
    g.lineWidth = 1;
  }
  private drawPrelimSelectedV(g: CanvasRenderingContext2D, rootX:number, rootY:number, selectStyle: string) {
    let d = 6;
    g.strokeStyle = selectStyle;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(rootX, rootY);
    g.lineTo(rootX + d, rootY + d);
    g.lineTo(rootX, rootY + d + d);
    g.lineTo(rootX - d, rootY + d);
    g.closePath();
    g.stroke();
    g.strokeStyle = "black";
    g.lineWidth = 1;
  }
  egVertical(xPoint: number, yPoint: number, xMin: number, xMax: number, yMin: number, yMax: number,
    cellHeight: number, hidden: BiClusterHidden): ClusterTree | undefined {

    let levels = this.depth();
    let height = yMax - yMin;
    let levelHeight = height / levels;
    let rootY = yMin;
    let rootX = xMin;
    let node = hidden.find(this);
    if (node) {
      rootX = (xMax - xMin) / 2 + xMin;
      if (yPoint >= yMin && yPoint <= yMax) {
        if (xPoint >= xMin && xPoint <= xMax) {
          return this;
        }
      }
      return undefined;
    } else {
      if (!this.left && !this.right) {
        rootX = (xMax - xMin) / 2 + xMin;
        if (yPoint >= rootY && yPoint <= (rootY + levelHeight)) {
          if (xPoint >= (rootX - 5) && xPoint <= (rootX + 5)) {
            return this;
          }
        }
        return ;
      } else {
        let ct: ClusterTree | undefined =undefined;
        let leftDesiredHeight = ClusterTree.desiredNodeHeight(this.left!, cellHeight, hidden);
        let rootX = xMin + leftDesiredHeight;
        ct = this.left!.egVertical(xPoint, yPoint, xMin, rootX - 1, rootY + levelHeight, yMax, cellHeight, hidden);
        if (ct) {
          return ct;
        }
        let rightDesiredHeight = ClusterTree.desiredNodeHeight(this.right!, cellHeight, hidden);
        ct = this.right!.egVertical(xPoint, yPoint, rootX, xMin + leftDesiredHeight + rightDesiredHeight,
          rootY + levelHeight, yMax, cellHeight, hidden);
        if (ct) {
          return ct;
        }
        if (yPoint >= rootY && yPoint <= (rootY + levelHeight)) {
          if (xPoint >= (rootX - 5) && xPoint <= (rootX + 5)) {
            return this;
          }
        }
        return;
      }
    }
  }
  vertSubtreeBounds(xMin: number, xMax: number, yMin: number, yMax: number,
    cellWidth: number, hidden: BiClusterHidden): Map<ClusterTree, { xMin: number, xMax: number, yMin: number, yMax: number }> {


    let bounds = this.horizSubtreeBounds(yMin, yMax, xMin, xMax, cellWidth, hidden);
    for (let [key, value] of bounds) {
      let temp = value.xMin;
      value.xMin = value.yMin;
      value.yMin = temp;
      temp = value.xMax;
      value.xMax = value.yMax;
      value.yMax = temp;
    }
    return bounds;
  }
  
  static drawHorizontalForest(forest: ClusterTree[], g: CanvasRenderingContext2D, xMin: number, xMax: number,
    yMin: number, yMax: number, cellHeight: number, select: BiClusterSelection, hidden: BiClusterHidden,
    strokeStyle = "black") {
    let leafNum = 0;
    let treeStart = yMin;
    let treeEnd = 0;
    for (let i = 0; i < forest.length; i++) {
      let tree = forest[i];
      leafNum += tree.items.length;
    }
    let width = yMax - yMin;
    let leafWidth = width / leafNum;
    for (let i = 0; i < forest.length; i++) {
      let tree = forest[i];
      let treeWidth = leafWidth * tree.items.length;
      treeEnd = treeStart + treeWidth;
      tree.drawHorizontal(g, xMin, xMax, treeStart, treeEnd, cellHeight, select, hidden, strokeStyle);
      treeStart = treeEnd;
    }
  }
  egHorizontalForest(forest: ClusterTree[], xPoint: number, yPoint: number, xMin: number, xMax: number,
    yMin: number, yMax: number, cellHeight: number, hidden: BiClusterHidden): ClusterTree | undefined {
    let leafNum = 0;
    let treeStart = yMin;
    let treeEnd = 0;
    for (let i = 0; i < forest.length; i++) {
      let tree = forest[i];
      leafNum += tree.items.length;
    }
    let width = yMax - yMin;
    let leafWidth = width / leafNum;
    for (let i = 0; i < forest.length; i++) {
      let tree = forest[i];
      let treeWidth = leafWidth * tree.items.length;
      treeEnd = treeStart + treeWidth;
      let eg = tree.egHorizontal(xPoint, yPoint, xMin, xMax, treeStart, treeEnd, cellHeight, hidden);
      if (eg) {
        return eg;
      }
      treeStart = treeEnd;
    }
    return ;
  }
  drawHorizontal(g: CanvasRenderingContext2D, xMin: number, xMax: number,
    yMin: number, yMax: number, cellHeight: number, selection: BiClusterSelection, hidden: BiClusterHidden,
    selectStyle = "black"): number {
    g.lineWidth = 1;
    let levels = this.depth();
    let height = xMax - xMin;
    let levelHeight = height / levels;
    let rootY = yMin;
    let rootX = xMin;

    let selected = selection.inSelections(this);
    if (selected) {
      selectStyle = <string>selected.color;
    }
    let prelimSelected = selection.inPreliminarySelections(this);
    let detailSelected = (this === selection.getDetailSelection("yCluster"));
    let hiddenNode = hidden.find(this);

    if (hiddenNode) {
      let L = Math.max(100 - hiddenNode.leaves.length * 10, 20);
      g.fillStyle = `hsl(195, 100%, ${L}%)`;
      g.fillRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1);
      rootY = (yMax - yMin) / 2 + yMin;
      if (selected) {
        this.drawSelectedH(g, rootX, rootY, selectStyle);
      }
      if (prelimSelected) {
        this.drawPrelimSelectedH(g, rootX, rootY, prelimSelected.color!);
      }
      if (detailSelected) {
        this.drawSelectedH(g, rootX, rootY, "red");
      }
      return rootY;
    } else {
      if (!this.left && !this.right) {
        rootY = (yMax - yMin) / 2 + yMin;
        g.strokeStyle = "black";
        g.beginPath();
        g.moveTo(xMin, rootY);
        g.lineTo(xMax, rootY);
        g.stroke();
        if (selected) {
          this.drawSelectedH(g, rootX, rootY, selectStyle);
        }
        if (prelimSelected) {
          this.drawPrelimSelectedH(g, rootX, rootY, prelimSelected.color!);
        }
        if (detailSelected) {
          this.drawSelectedH(g, rootX, rootY, "red");
        }
        return rootY;
      } else {
        let leftDesiredHeight = ClusterTree.desiredNodeHeight(this.left!, cellHeight, hidden);
        let rootY = yMin + leftDesiredHeight;
        g.strokeStyle = "black";
        g.beginPath();
        g.moveTo(rootX, rootY);
        g.lineTo(rootX + levelHeight, rootY);
        g.stroke();
        let a = this.left!.drawHorizontal(g, rootX + levelHeight, xMax, yMin, rootY - 1,
          cellHeight, selection, hidden, selectStyle);
        let rightDesiredHeight = ClusterTree.desiredNodeHeight(this.right!, cellHeight, hidden);
        let b = this.right!.drawHorizontal(g, rootX + levelHeight, xMax, rootY,
          yMin + leftDesiredHeight + rightDesiredHeight - 1, cellHeight, selection, hidden, selectStyle);
        g.strokeStyle = "black";
        g.beginPath();
        g.moveTo((rootX + levelHeight), a);
        g.lineTo((rootX + levelHeight), b)
        g.stroke();
        if (selected) {
          this.drawSelectedH(g, rootX, rootY, selectStyle);
        }
        if (prelimSelected) {
          this.drawPrelimSelectedH(g, rootX, rootY, prelimSelected.color!);
        }
        if (detailSelected) {
          this.drawSelectedH(g, rootX, rootY, "red");
        }
        return rootY;
      }
    }
  }
  private drawSelectedH(g: CanvasRenderingContext2D, rootX:number, rootY:number, selectStyle: string) {
    let d = 6;
    g.fillStyle = selectStyle
    g.beginPath();
    g.moveTo(rootX, rootY);
    g.lineTo(rootX + d, rootY + d);
    g.lineTo(rootX + d + d, rootY);
    g.lineTo(rootX + d, rootY - d);
    g.closePath();
    g.fill();
    g.strokeStyle = "black";
    g.lineWidth = 1;
  }
  private drawPrelimSelectedH(g: CanvasRenderingContext2D, rootX:number, rootY:number, selectStyle: string) {
    let d = 6;
    g.strokeStyle = selectStyle;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(rootX, rootY);
    g.lineTo(rootX + d, rootY + d);
    g.lineTo(rootX + d + d, rootY);
    g.lineTo(rootX + d, rootY - d);
    g.closePath();
    g.stroke();
    g.strokeStyle = "black";
    g.lineWidth = 1;
  }
  egHorizontal(xPoint: number, yPoint: number, xMin: number, xMax: number, yMin: number, yMax: number,
    cellHeight: number, hidden: BiClusterHidden): ClusterTree | undefined {

    let levels = this.depth();
    let height = xMax - xMin;
    let levelHeight = height / levels;
    let rootY = yMin;
    let rootX = xMin;
    let node = hidden.find(this);
    if (node) {
      rootY = (yMax - yMin) / 2 + yMin;
      if (xPoint >= xMin && xPoint <= xMax) {
        if (yPoint >= yMin && yPoint <= yMax) {
          return this;
        }
      }
      return ;
    } else {
      if (!this.left && !this.right) {
        rootY = (yMax - yMin) / 2 + yMin;
        if (xPoint >= rootX && xPoint <= (rootX + levelHeight)) {
          if (yPoint >= (rootY - 5) && yPoint <= (rootY + 5)) {
            return this;
          }
        }
        return ;
      } else {
        let ct: ClusterTree|undefined = undefined;
        let leftDesiredHeight = ClusterTree.desiredNodeHeight(this.left!, cellHeight, hidden);
        let rootY = yMin + leftDesiredHeight;
        ct = this.left!.egHorizontal(xPoint, yPoint, rootX + levelHeight, xMax, yMin, rootY - 1, cellHeight, hidden);
        if (ct) {
          return ct;
        }
        let rightDesiredHeight = ClusterTree.desiredNodeHeight(this.right!, cellHeight, hidden);
        ct = this.right!.egHorizontal(xPoint, yPoint, rootX + levelHeight, xMax, rootY,
          yMin + leftDesiredHeight + rightDesiredHeight - 1, cellHeight, hidden);
        if (ct) {
          return ct;
        }
        if (xPoint >= rootX && xPoint <= (rootX + levelHeight)) {
          if (yPoint >= (rootY - 5) && yPoint <= (rootY + 5)) {
            return this;
          }
        }
        return ;
      }
    }
  }
  horizSubtreeBounds(xMin: number, xMax: number, yMin: number, yMax: number,
    cellHeight: number, hidden: BiClusterHidden): Map<ClusterTree, { xMin: number, xMax: number, yMin: number, yMax: number }> {

    let bounds = new Map<ClusterTree, { xMin: number, xMax: number, yMin: number, yMax: number }>();
    this.horizSubtreeBounds_Helper(xMin, xMax, yMin, yMax, cellHeight, hidden, bounds);
    return bounds;
  }
  private horizSubtreeBounds_Helper(xMin: number, xMax: number, yMin: number, yMax: number, cellHeight: number,
    hidden: BiClusterHidden, bounds: Map<ClusterTree, { xMin: number, xMax: number, yMin: number, yMax: number }>): void {

    bounds.set(this, { xMin, xMax, yMin, yMax });

    let levels = this.depth();
    let height = xMax - xMin;
    let levelHeight = height / levels;
    let node = hidden.find(this);
    if (node) {
      return;
    }
    else if (!this.left && !this.right) {
      return;
    }
    else {
      let leftDesiredHeight = ClusterTree.desiredNodeHeight(this.left!, cellHeight, hidden);
      let leftXMin = xMin + levelHeight;
      let leftXMax = xMax;
      let leftYMin = yMin;
      let leftYMax = yMin + leftDesiredHeight - 1;
      this.left!.horizSubtreeBounds_Helper(leftXMin, leftXMax, leftYMin, leftYMax, cellHeight, hidden, bounds);

      // let rightDesiredHeight = ClusterTree.desiredNodeHeight(this.right!, cellHeight, hidden);
      let rightXMin = xMin + levelHeight;
      let rightXMax = xMax;
      let rightYMin = yMin + leftDesiredHeight;
      let rightYMax = yMax;
      this.right!.horizSubtreeBounds_Helper(rightXMin, rightXMax, rightYMin, rightYMax,
        cellHeight, hidden, bounds);
    }
  }
  public static desiredNodeHeight(ct: ClusterTree, cellHeight: number, hidden: BiClusterHidden): number {
    let totalLeafNodes = ct.leftToRight().length;
    let hiddenInfo = ClusterTree.hiddenStats(ct, hidden);
    let baseHeight = (totalLeafNodes * cellHeight);
    let invisibleLeafNodes = (totalLeafNodes - hiddenInfo.visibleLeafNodes);
    let hiddenNodes = hiddenInfo.hiddenNodes;
    let desHeight = (baseHeight -
      (invisibleLeafNodes * cellHeight) +
      (hiddenNodes * cellHeight));
    return desHeight;
  }
  // public static desiredNodeWidth(ct: ClusterTree, cellWidth: number, hidden: BiClusterHidden): number {
  //   let totalLeafNodes = ct.leftToRight().length;
  //   let hiddenInfo = ClusterTree.hiddenStats(ct, hidden);
  //   let baseWidth = (totalLeafNodes * cellWidth);
  //   let invisibleLeafNodes = (totalLeafNodes - hiddenInfo.visibleLeafNodes);
  //   let hiddenNodes = hiddenInfo.hiddenNodes;
  //   let desWidth = (baseWidth -
  //     (invisibleLeafNodes * cellWidth) +
  //     (hiddenNodes * cellWidth));
  //   return desWidth;
  // }
  public static selectedNodes(ct: ClusterTree, region: string, hidden: BiClusterHidden, leafSize: number,
    selectedMin: number, selectedMax: number): Set<ClusterTree> {

    let selNodes = new Set<ClusterTree>();
    let allLeaves = ct.leafNodes();
    let leafMin = 0;
    let leafMax = leafSize - 1;
    let drawHiddenLeafRanges = hidden.drawHiddenLeafRanges.get(region)!;

    for (let i = 0; i < allLeaves.length; i++) {
      if ((leafMin >= selectedMin && leafMin <= selectedMax) ||
        (leafMax >= selectedMin && leafMax <= selectedMax)) {
        let leaf = allLeaves[i];
        selNodes.add(leaf);
      }
      let curLeafRangeIndex = drawHiddenLeafRanges.findIndex(
        (r) => r.firstLeafIndex <= i && i <= r.lastLeafIndex);
      let nextLeafRangeIndex = drawHiddenLeafRanges.findIndex(
        (r) => r.firstLeafIndex <= (i + 1) && (i + 1) <= r.lastLeafIndex);
      if ((curLeafRangeIndex < 0) || (nextLeafRangeIndex < 0) ||
        (curLeafRangeIndex !== nextLeafRangeIndex)) {
        leafMin += leafSize;
        leafMax += leafSize;
      }
    }

    // Merge sibling selected nodes.
    //******************************
    let allNodes = ct.allNodes();
    while (true) {
      let found = false;
      for (let node of allNodes) {
        if (node.left && selNodes.has(node.left) && node.right && selNodes.has(node.right)) {
          found = true;
          selNodes.add(node);
          selNodes.delete(node.left);
          selNodes.delete(node.right);
        }
      }
      if (!found) {
        break;
      }
    }

    return selNodes;
  }
  public static hiddenStats(ct: ClusterTree, hidden: BiClusterHidden): { visibleLeafNodes: number, hiddenNodes: number } {
    if (hidden.find(ct)) {
      return { visibleLeafNodes: 0, hiddenNodes: 1 };
    } else if (!ct.left && !ct.right) {
      return { visibleLeafNodes: 1, hiddenNodes: 0 };
    } else {
      let leftStats = ClusterTree.hiddenStats(ct.left!, hidden);
      let rightStats = ClusterTree.hiddenStats(ct.right!, hidden);
      return {
        visibleLeafNodes: leftStats.visibleLeafNodes + rightStats.visibleLeafNodes,
        hiddenNodes: leftStats.hiddenNodes + rightStats.hiddenNodes
      };
    }
  }
  allNodes(): ClusterTree[] {
    // Level-order traversal of the tree.
    let nodes: ClusterTree[] = [];
    let queue: ClusterTree[] = [this];
    let nodesSet = new Set<ClusterTree>();
    while (queue.length > 0) {
      let node = queue.shift()!;
      nodes.push(node);
      nodesSet.add(node);
      if (node.left) {
        queue.push(node.left);
      }
      if (node.right) {
        queue.push(node.right);
      }
    }
    console.assert(nodes.length === nodesSet.size, "Duplicate nodes found in the tree.");
    return nodes;
  }
  leafNodes(): ClusterTree[] {
    let cl: ClusterTree[] = [];
    if (!this.left && !this.right) {
      cl.push(this);
    } else {
      if (this.left) {
        cl = cl.concat(this.left.leafNodes());
      }
      if (this.right) {
        cl = cl.concat(this.right.leafNodes());
      }
    }
    return cl;
  }
  leftToRight(): number[] {
    let cl: number[] = [];
    let cr: number[] = [];
    if (!this.left && !this.right) {
      return this.items;
    } else {
      if (this.left) {
        cl = this.left.leftToRight();
      }
      if (this.right) {
        cr = this.right.leftToRight();
      }
      let clcr = cl.concat(cr);
      return clcr;
    }
  }
  toJSON(): any {
    let left: ClusterTree | null = null;
    let right: ClusterTree | null = null;
    if (this.left) {
      left = this.left.toJSON();
    }
    if (this.right) {
      right = this.right.toJSON();
    }
    let rslt = {
      left: left,
      right: right,
      items: this.items,
      id: this.id,
      desc: this.description
    }
    return rslt;
  }
  fromJSON(json: any) {
    if (json.left) {
      this.left = new ClusterTree();
      this.left?.fromJSON(json.left);
    }
    if (json.right) {
      this.right = new ClusterTree();
      this.right?.fromJSON(json.right);
    }
    this.items = json.items;
    this.id = json.id;
    this.description = json.desc;
  }
}

