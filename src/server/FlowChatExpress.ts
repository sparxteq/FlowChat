import { FlowChatEnv } from "./FlowChatEnv";
import express, { NextFunction,Request,Response } from "express";
import session from "express-session";
import https from "https";
import fs from "fs";
import { DB } from "../../../Zing3/share/DB";
import { ServerHTTP } from "./ServerHTTP";
import { FlowChatContext } from "../common/FlowChatContext";
import { FilesFS } from "./files/FilesFS";


export class FlowChatExpress{
    app:any;
    env:FlowChatEnv;
    constructor(env:FlowChatEnv){
        this.env=env;
        FilesFS.setRootPath(<string>process.env.FILE_SYS_STORAGE)
        this.setupServer()
    }
    private noCache(req:Request,res:Response,next:NextFunction){
        res.set('Cache-Control','public,max-age=0');
        next();
    }
    private setupServer(){
        this.app=express()
        this.app.use(express.json({limit:'50mb'}));
        this.app.use(
            session({
                secret:"ZFlow session secret to change",
                resave:false,
                saveUninitialized:false,
                cookie:{
                    secure:false,
                    maxAge:1000*60*60
                }
            })
        )

        this.app.use(express.urlencoded({ extended:false, limit:'50mb'}));
        //this.app.use(this.httpDebugMsg) // debugging assistance
        this.app.use(this.noCache) // defeat all caching
        
        this.app.use(express.static('war'));
        let server = new ServerHTTP()
        this.app.get('/',async (req:Request,res:Response)=>{
            res.send(this.env.indexHTML(req.query))
        })
        this.app.put('/do',async(req:Request,res:Response)=>{
            DB.msg("/do called")
            let query=req.query;
            let cmd = query.cmd;
            DB.msg("    query",query)
            if (!cmd){
                res.send({success:false,msg:"no valid cmd in the query"})
            }
            let json = req.body;
            let rslt = await server.do(<string>cmd,json,req,res)
            res.send(rslt);
        })
    }
    listen(portNumber:number){
        let httpsCertPath = this.env.httpsCertPath();
        if (httpsCertPath){
            try{
                let key = fs.readFileSync(`${httpsCertPath}.key`)
                let crt = fs.readFileSync(`${httpsCertPath}.crt`)
                let cert = {
                    key: key,
                    cert: crt
                }
                let httpsApp = https.createServer(cert,this.app);
                httpsApp.listen(portNumber,()=>{
                    DB.msg("start https");
                })
            } catch (e){
                DB.msg("HTTPS error",e)
            }
        } else {
            this.app.listen(portNumber);
        }
        
    }
}