import {DB} from "../../../Zing3/share/DB"
import dotenv from "dotenv"
import { FlowChatEnv } from "./FlowChatEnv";
import { FlowChatExpress } from "./FlowChatExpress";
import { registerUnitsAndTypes } from "./units/RegisterUnitsAndTypes";

DB.msg("server launch started")
dotenv.config();

registerUnitsAndTypes()

let env = new FlowChatEnv()

//let flowContext = new ZFlowContextFS(env.sourceFileStore())

let app = new FlowChatExpress(env)
//DB.msg("server running")
env.serverStartNotice();
app.listen(env.serverPort())