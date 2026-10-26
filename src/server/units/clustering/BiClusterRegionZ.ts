

import { ZUI } from "../../../../../Zing3/zui/ZUI";
import { BiClusterSelection } from "./BiClusterSelection";
import { BiClusterHidden } from "./BiClusterHidden"
import { BiClusterModel } from "./BiClusterModel";

export abstract class BiClusterRegionZ extends ZUI {
    protected model: BiClusterModel | undefined;
    protected select: BiClusterSelection | undefined;
    protected hidden: BiClusterHidden | undefined;

    setModel(model: BiClusterModel) {
        this.model = model;
    }
    setSelection(select: BiClusterSelection) {
        this.select = select;
    }
    setHidden(hidden: BiClusterHidden) {
        this.hidden = hidden;
    }
    abstract gridCell(): { col: number, row: number };
    abstract makeNew(): BiClusterRegionZ;
    abstract name(): string;
    private static registry: {
        [regionName: string]: {
            userName: string,
            region: BiClusterRegionZ
        }
    } = {};
    static register(region: BiClusterRegionZ) {
        let name = region.constructor.name;
        this.registry[name] = {
            userName: region.name(),
            region: region
        };
    }
    static getRegion(regionName: string): BiClusterRegionZ {
        return this.registry[regionName].region.makeNew();
    }
    static getRegionUsername(regionName: string): string {
        return this.registry[regionName].userName;
    }
    static regions(): string[] {
        return Object.keys(this.registry);
    }
}