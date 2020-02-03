#!/usr/bin/env node

const parser = require('cue-parser');
const fs = require('fs').promises;
const path = require('path');
const Queue = require('./Queue');
const { exec } = require('child_process');

const outputQuality = " -q:a 0 ";
const threadCounterMax = require('os').cpus().length;

const sourceDirArg = 2;
const targetDirArg = 3;

const rootDir = process.argv[sourceDirArg] ? path.resolve(process.argv[sourceDirArg]) : process.cwd();
const outDir = process.argv[targetDirArg] ? path.resolve(process.argv[targetDirArg]) : path.join(rootDir, "..", "out");

console.log(rootDir, outDir);

let threadCounter = 0;
let jobQueue = new Queue({ max: 10000});
const hrstart = process.hrtime()

function convert(args) {
    let params = args.params;
    ++threadCounter;
    // console.log("Threads+ " + threadCounter);
    exec('ffmpeg -n ' + params, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
        }
        console.log("Done: " + args.jobName);
        //console.log(`stdout: ${stdout}`);
        //console.error(`stderr: ${stderr}`);
        --threadCounter;
        // console.log("Threads- " + threadCounter);
        if (threadCounter === 0) {
            const hrend = process.hrtime(hrstart)
            console.log('Execution time (hr): %ds %dms', hrend[0], (hrend[1] / 1000000).toFixed(2))
        }
        next = jobQueue.getNext();
        if (next) {
            convert(next);
        }
    });
}

function addJob(params) {
    if (threadCounter < threadCounterMax) {
        convert(params);
    } else {
        jobQueue.add(params);
    }
}

function getFileConvertParams(dir, file) {
    let params = `-i "${path.join(rootDir, dir, file)}"${outputQuality}"${path.join(outDir, dir, path.parse(file).name)}.mp3"`;
    let jobName = `${path.join(dir, path.parse(file).name)}.mp3"`
    return {params, jobName};
}

function getTime(cueTime) {
    return ((cueTime.min * 60) + cueTime.sec + (cueTime.frame / 75)).toFixed(3);
}

function getMetadata(track) {
    const table = {
        title: "title",
        number: "track",
        performer: "artist"
    }
    let metaDataParams = "";
    for (key in table) {
        data = track[key];
        if (data) {
            metaDataParams += `-metadata ${table[key]}="${data}" `
        }
    }
    return metaDataParams;
}

function getCueConvertParams(dir, file) {
    const cuesheet = parser.parse(path.join(rootDir, dir, file));
    const result = [];
    cuesheet.files.forEach(file => {
        const inputFile = path.join(rootDir, dir, file.name);
        const tracksNumber = file.tracks.length;
        file.tracks.forEach((track, index) => {
            let ffmpegParams = "";
            const startTime = getTime(track.indexes[0].time);
            ffmpegParams += `-ss ${startTime} `
            const nextTrackIndex = index + 1;
            if (nextTrackIndex < tracksNumber) {
               const endTime = getTime(file.tracks[nextTrackIndex].indexes[0].time);
               ffmpegParams += `-to ${endTime} `;
            }
            const inputFileParam = `-i "${inputFile}"`;
            const i = String(index + 1).padStart(2, '0');
            const outputFileName = `${i}. ${track.title}.mp3`
            const outputFilePath = `"${path.join(outDir, dir, outputFileName)}" `
            const metadata = getMetadata(track);
            ffmpegParams += inputFileParam + outputQuality + metadata + outputFilePath
            result.push({params: ffmpegParams, jobName: path.join(dir, outputFileName)});
        })
    })
    return result;
}

function getFilesByType(files, type) {
    return files.filter(f => {
        return path.extname(f.name) === ('.' + type);
    })
}

async function runOnDir(dirPath) {
    dirPath = dirPath || "";
    const fullPath = path.join(rootDir, dirPath);
    const entries = await fs.readdir(fullPath, {withFileTypes: true});
    const dirs = entries.filter(f => f.isDirectory());
    const files = entries.filter(f => f.isFile());
    dirs.forEach(dir => runOnDir(path.join(dirPath, dir.name)));
    const flacFiles = getFilesByType(files, "flac");
    const cueFiles = getFilesByType(files, "cue");
    if (flacFiles.length > 0) {
//      console.log("Flac files: " + flacFiles.map(f => f.name).toString());
        await fs.mkdir(path.join(outDir, dirPath), { recursive: true });
         if (flacFiles.length === cueFiles.length) {
             cueFiles.forEach(cue => {
                 getCueConvertParams(dirPath, cue.name).forEach(p => {
                        addJob(p);
                    });
                });
         }
         else {
             flacFiles.forEach(f => {
                 addJob(getFileConvertParams(dirPath, f.name));
             });
         }
    }
}

runOnDir();
