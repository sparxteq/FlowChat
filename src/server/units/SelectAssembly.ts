import { Log } from "../../client/log/Log";
import { TypeName, StepRunJSON } from "../../common/WorkbookJSON";
import { ZDict, ZT } from "../../common/ZT";
import { ReadTableCSV } from "../tables/ReadTableCSV";
import { WriteTableCSV } from "../tables/WriteTableCSV";
import { WorkServer } from "../WorkServer";
import { Unit } from "./Unit";



export class SelectAssembly extends Unit{
    
    description(): string {
        return `Takes a selected assembly file an imports it as an output variable`;
    }
    paramType(): ZT {
        return new ZDict()
            .fileName("sourceFile")
    }
    defaultParam() {
        return {sourceFile:""};
    }
    inputTypes(): { inputId: string; typeName: TypeName; }[] {
        return []
    }
    outputTypes(): { outputId: string; typeName: TypeName; }[] {
        return [
            {outputId:"assembly.csv",typeName:this.checkType("CSV")}
        ]
    }
    async run(instanceInfo: StepRunJSON, log: Log): Promise<boolean> {
        let ii = instanceInfo;
        let param = <SelectAssemblyParam>instanceInfo.paramValue;
        let assemblySourceN = param.sourceFile;
        if (assemblySourceN==""){
            log.msg("no source file selected")
            return false;
        }
        let projFolderN = WorkServer.projFolderName(ii.userEmail,ii.actId,ii.projId)
        assemblySourceN = projFolderN+"/"+assemblySourceN;
        let inTable = new ReadTableCSV(assemblySourceN);
        await inTable.openR();
        
        let inTypes = inTable.getColTypes();

        let assemblyTableN = this.outputFileName("assembly.csv",instanceInfo);
        let assemblyTable = new WriteTableCSV(assemblyTableN);
        assemblyTable.setColTypes(inTypes);
        await assemblyTable.openW();

        let row = await inTable.nextRow();
        while(row){
            await assemblyTable.addRow(row)
            row = await inTable.nextRow();
        }
        await inTable.close();
        await assemblyTable.close();
        return true;
    }
    
}
type SelectAssemblyParam = {
    sourceFile:string;
}