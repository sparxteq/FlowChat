import { FlowChatEnv } from "./FlowChatEnv";
import express, { NextFunction,Request,Response } from "express";
import session from "express-session";
import https from "https";
import fs from "fs";
import { DB } from "../../../Zing3/share/DB";


export class FlowChatExpress{
    app:any;
    env:FlowChatEnv;
    constructor(env:FlowChatEnv){
        this.env=env;
        this.setupServer()
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
        //this.app.use(this.noCache) // defeat all caching
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