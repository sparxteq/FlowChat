import { Log } from "../../client/log/Log";
import { randomF } from "../../common/Random";
import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { ZDict, ZT } from "../../common/ZT";
import { ReadTableCSV } from "../tables/ReadTableCSV";
import { WriteTableCSV } from "../tables/WriteTableCSV";
import { Unit } from "./Unit";




export class RandomRowSelect extends Unit{
    description(): string {
        return `Randomly selects rows from a table and passes them to the Selected table.
                rows not selected are passed to the Unselected table`;
    }
    paramType(): ZT {
        return new ZDict()
            .num("seed")
            .num("percentToSample",{decimals:1})
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return [ {inputId:"table",typeName:this.checkType("CSV")}];
    }
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [{outputId:"selected.csv",typeName:this.checkType("CSV")},
            {outputId:"unselected.csv",typeName:this.checkType("CSV")}
        ];
    }
    defaultParam():RandomRowSelectParam{
        return {seed:7,percentToSample:70};
    }
    private seed=1;
    async run(instanceInfo: StepRunJSON, log: Log): Promise<boolean> {
        let param = <RandomRowSelectParam>instanceInfo.paramValue;
        this.seed = param.seed;
        let percent = param.percentToSample;
        if (percent<1)
            percent=1;
        if (percent>100)
            percent=100;
        let fraction = percent/100;
        let inTableName=this.inputFileName("table",instanceInfo)
        let inTable = new ReadTableCSV(inTableName)
        await inTable.openR();
        let inColTypes = inTable.getColTypes();

        let selectedName = this.outputFileName("selected.csv",instanceInfo);
        let selected = new WriteTableCSV(selectedName);
        selected.setColTypes(inColTypes);
        await selected.openW();
        let unselectedName = this.outputFileName("unselected.csv",instanceInfo);
        let unselected = new WriteTableCSV(unselectedName);
        unselected.setColTypes(inColTypes);
        await unselected.openW();

        let random = randomF(this.seed)
        let row = await inTable.nextRow();
        while (row){
            let r = random();
            if (r<fraction){
                await selected.addRow(row);
            } else {
                await unselected.addRow(row);
            }
            row = await inTable.nextRow();
        }
        await inTable.close();
        await selected.close();
        await unselected.close();
        return true;
    }
    
}
type RandomRowSelectParam = {
    seed:number,
    percentToSample:number
}