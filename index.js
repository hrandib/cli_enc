#!/usr/bin/env node

const parser = require('cue-parser');
const fs = require('fs').promises;
const path = require('path');

const rootDir = "res";
const outDir = "out"

function getFilesByType(files, type) {
    return files.filter(f => {
        return path.extname(f.name) === ('.' + type);
    })
}

function useCue(files) {
    return getFilesByType(files, "flac").length === getFilesByType(files, "cue").length;
}

async function runOnDir(rootDir, dirPath) {
    dirPath = dirPath || "";
    const fullPath = path.join(rootDir, dirPath);
    const entries = await fs.readdir(fullPath, {withFileTypes: true});
    const dirs = entries.filter(f => f.isDirectory());
    const files = entries.filter(f => f.isFile());
    dirs.forEach(dir => runOnDir(rootDir, path.join(dirPath, dir.name)));
    // console.log("Run on " + path.join(rootDir, dirPath));
    // console.log("Out is " + path.join(rootDir, "..", outDir, dirPath));
    const flacFiles = getFilesByType(files, "flac");
    const cueFiles = getFilesByType(files, "cue");
    if (cueFiles.length > 0) {
        console.log("Cue files: " + getFilesByType(files, "cue").map(f => f.name).toString());
    }
    if (flacFiles.length > 0) {
        console.log("Flac files: " + flacFiles.map(f => f.name).toString());
        if (useCue(files)) {
            console.log("use cue");
            //use cue parser
        }
        else {
            console.log("direct conversion");
            //use direct conversion
        }
    }
}

runOnDir(rootDir);