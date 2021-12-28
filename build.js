import getContainerInfo from "./containerInfo.js";
import { spawn } from "child_process";

const insiders = true;
const buildCommand = `devcontainer${insiders ? "-insiders" : null}`

//todo: console log levels for build scripts and for stdout for devcontainer build proccesses
//todo: publish flag

async function build() {
    const containerInfo = await getContainerInfo();
    //log errored container info
    containerInfo.filter(i => i.status === "rejected")
        .forEach(e => console.log(`Failed to get container info. REASON: ${e.reason}`));

    const resolvedInfo = containerInfos.filter(i => i.status === "fulfilled").map(i => i.value);
    const noDepends = resolvedInfo.filter(i => i.depends === undefined);

    //todo: build dependency tree

    const buildProcesses = resolvedInfo.map(container => spawnProcess(container));

    await Promise.allSettled(buildProcesses);

    //const noDependsBuilds = noDepends.map(container => spawnProcess(container));
    //await Promise.allSettled([noDependsBuilds]);

    console.log("DONE");
}

function spawnProcess(containerInfo) {
    new Promise((resolve, reject) => {        
        const container = containerInfo.value;
        const buildProcess = spawn(buildCommand,[
            "build",
            "--imageName",
            container.imageName,
            container.path
        ],
        { stdio: "inherit" });
        buildProcess.on("close", code => resolve(code));
        buildProcess.on("error", error => reject(error));
    })
}

await build();