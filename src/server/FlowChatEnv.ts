import { DB } from "../../../Zing3/share/DB";
import { ServerHTTP } from "./ServerHTTP";


var CLIENT_IS_SANDBOX = false;
var CLIENT_IS_DEBUG = false;

export class FlowChatEnv {
    private query: any;
    indexHTML(query: any): string {
        let body =
            `<html>
                <head>
                <script
                    src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
                    integrity="sha256-3edrmyuQ0w65f8gfBsqowzjJe2iM6n0nKciPUp8y+7E="
                    crossorigin="anonymous">
                </script>
                <script type="text/javascript" src="/js/pako.min.js">console.log("here")</script>
                <link rel="stylesheet" type="text/css" href="/clientMain.css"/>
                </head>
                <body>
                    <div id="content">SparxBio</div>
                    <script>var CLIENT_IS_SANDBOX = ${CLIENT_IS_SANDBOX}</script>
                    <script>var CLIENT_IS_DEBUG = ${CLIENT_IS_DEBUG}</script>
                    <script src="/client.js"></script>
                    <div id="modaloverlay" class="hidden"></div>
                </body>
            </html>`
        return body;
    }

    loginStyleSheet(): string {
        return "/clientMain.css"
    }
    loginJQuery(): string {
        return "https://code.jquery.com/jquery-3.3.1.slim.min.js"
    }
    systemName(): string {
        return "Magellan-Compass"
    }
    pageHTML(root: string, pageName: string): string {
        return this.indexHTML(this.query);
    }
    serverPort() {
        return parseInt(process.env.SERVER_PORT || "4000");
    }
 
    serverStartNotice(): void {
        let port = this.serverPort();
        DB.msg("starting server @ ",port)
    }
    sourceFileStore(): string {
        // Should be "fs" or "s3".
        return (process.env.SOURCE_FILE_STORE || "fs");
    }
    httpsCertPath():string{
        if (process.env.HTTPS_CERT_PATH)
            return process.env.HTTPS_CERT_PATH;
        return "";
    }

    loginHTML():string{
        return `
            <html>
                ${this.htmlHead()}
                <body>
                    <div class="DivUI HomeHeader">
                        <div class="TextUI HomeHeaderText">${this.systemName()}</div>
                    </div>
                    <div class="TextUI Login-title">Login</div>
                    <div class="DivUI Login-block">
                        <div class="TextUI col-6">E mail</div>
                        <div class="TextUI col-6">Password</div>
                        <input id="email" type="email" placeholder="" class="InputUI col-6">
                        <input id="password" type="password" autocapitalize="off" placeholder="" class="InputUI col-6">
                        <button id="LoginBtn" class="ButtonUI col-12">Login</button>
                    </div>
                    <div class="DivUI Login-block" style="text-align:center; color:white">
                        <a href="/account/new">Create New Account</a>
                    </div>
                    <div class="DivUI Login-block" style="text-align:center; color:white">
                        <a href="/account/update">Manage Account</a>
                    </div>
                    <div id="message" class="TextUI Login-title" style="color:red"></div>
                    <script>
                        console.log("footer");
                        $("#LoginBtn").click(()=>{
                                                                                                                                let em = $("#email").val().toLowerCase();
                            let pw = $("#password").val();
                            login(em,pw)
                        })
                    </script>
                </body>
            </html>
        `
    } 
    private htmlHead():string{
        return `
            <head>
                <script src="${this.loginJQuery()}">
                </script>
                <script>
                    ${this.loginScript()}
                </script>
                <link rel="stylesheet" type="text/css" href="${this.loginStyleSheet()}"/>
            </head>
        `
    }
    protected loginScript():string{
        return `
            async function userRightsDo(params){
                clearMessage()
                let url = "/do/?op=userRights";
                let rslt = await fetch(url,{
                    method:"POST",
                    headers: {
                        "Content-Type":"application/json"
                    },
                    body: JSON.stringify(params)
                })
                let json = rslt.json();
                return json
            }
            async function login(email,password){
                return loginH(email,password)
            }
            function loginH(email,password){
                console.log("login "+email+"   "+password)
                userRightsDo({
                    action:"loginH",
                    password:password,
                    userId:email
                })
                .then(rslt=>{
                    let result = rslt.result;
                    if (result.isLoggedIn){
                        window.location.href="/";
                    } else {
                        message(result.message)
                    }
                })
                .catch(error=>{
                    message(error)
                })
            }
            async function createAccount(email,password,firstName,lastName){
                console.log("createAccount "+email+" "+password+" "+firstName+" "+lastName)
                let rslt = await userRightsDo({
                    action:"createUser",
                    userId:email,
                    password:password,
                    email:email,
                    firstName:firstName,
                    lastName:lastName,
                    makeSuper:false
                })
                return rslt.result;
            }
            async function updateAccount(email,password,firstName,lastName){
                console.log("updateAccount "+email+" newPwd "+password+" "+firstName+" "+lastName)
                let rslt = await userRightsDo({
                    action:"updateUser",
                    userId:email,
                    email:email,
                    newPassword:password,
                    firstName:firstName,
                    lastName:lastName,
                    makeSuper:false
                })
                return rslt.result;
            }
            function message(msg){
                let jq=$("#message")
                jq.html(msg)
            }
            function clearMessage(){
                $("#message").html("")
            }

        `
    }
}