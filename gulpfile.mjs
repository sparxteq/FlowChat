import gulp from 'gulp'
import { gulpEsbuild } from 'gulp-esbuild'
import ts from 'gulp-typescript'
import sourcemaps from 'gulp-sourcemaps'
import fs from 'fs'
import fse from 'fs-extra'
import {exec} from 'child_process'
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'
import rename from "gulp-rename";
const sass = gulpSass(dartSass)

const paths = {
    entry:'src/server/server.ts',
    outdir:'dist',
}
let version = "0.0.1"

function setVersion() {
    fs.writeFileSync("./src/version.ts",`export var versionName = "${version}"\n`)
}

function typecheckClient(cb) {
    exec("npx tsc --noEmit -p tsconfig.client.json",(error,stdout,stderr)=>{
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
        cb(error || null);
    })
}
function typecheckServer(cb) {
    exec("npx tsc --noEmit -p tsconfig.s.json",(error,stdout,stderr)=>{
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
        cb(error || null);
    })
}
function typecheckWorker(cb) {
    exec("npx tsc --noEmit -p tsconfig.s.json",(error,stdout,stderr)=>{
        if (stdout) console.log(stdout);
        if (stderr) console.log(stderr);
        cb(error || null);
    })
}
async function serverTS(){
    setVersion();
    return gulp
        .src(paths.entry)
        .pipe(
            gulpEsbuild({
                entryPoints: [paths.entry],
                platform:"node",
                bundle:true,
                outfile:"server.js",
                target: "node18",
                sourcemap: true,
                format: "cjs",
                logLevel:"info"
            })
        )
        .pipe(gulp.dest(paths.outdir))
}
gulp.task("server",gulp.series(typecheckServer,serverTS))

async function worker(){
    setVersion();
    return await gulp
        .src('src/workers/ZStepWorker.ts')
        .pipe(
            gulpEsbuild({
                entryPoints: ['src/workers/ZStepWorker.ts'],
                platform:"node",
                bundle:true,
                outfile:'worker.js',
                target: "node18",
                sourcemap: true,
                format: "cjs",
                logLevel:"info"
            })
        )
        .pipe(gulp.dest(paths.outdir))
}
gulp.task("worker",gulp.series(typecheckWorker,worker))
async function client(){
    setVersion();
    return await gulp
        .src('src/client/client.ts')
        .pipe(
            gulpEsbuild({
                entryPoints: ['src/client/client.ts'],
                platform:"node",
                bundle:true,
                outfile:'client.js',
                target: "node18",
                sourcemap: true,
                format: "cjs",
                logLevel:"info"
            })
        )
        .pipe(gulp.dest('./war'))
}
gulp.task('styles',  async function() {
  return await gulp.src('src/client/clientMain.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./war'));
});
gulp.task("client",gulp.series("styles",typecheckClient,client));

export const build = gulp.series("server","client","worker");