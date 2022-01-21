import getContainerInfo from "./containerInfo.js";
import { spawn, exec } from "child_process";

const insiders = false;
const publish = true;
const buildCommand = `devcontainer${insiders ? "-insiders" : ""}`
//node doesnt support 32bit intel (linux/386)
const platforms = ["linux/amd64","linux/arm64","linux/arm"]

//todo: console log levels for build scripts and for stdout for devcontainer build proccesses
//todo: publish flag

async function build() {
    const containerInfo = await getContainerInfo();
    //log errored container info
    containerInfo.filter(i => i.status === "rejected")
        .forEach(e => console.log(`Failed to get container info. REASON: ${e.reason}`));

    const resolvedInfo = containerInfo.filter(i => i.status === "fulfilled").map(i => i.value);

    const buildOrder = sortContainers(resolvedInfo)
        .map(level => 
            level.map(name => 
                resolvedInfo.find(c => 
                    c.imageName === name)));
    
    await spawnCreateBuildContainer();
    for (const level of buildOrder) {
        const buildProcesses = level.map(async container => {
            
            await spawnBuildProcess(container);
            //await spawnPublishProcess(container);
            //node wont exit until removal processes are done
            
        });

        await Promise.allSettled(buildProcesses);
    }
    spawnRemoveBuildContainer();

    console.log("Cleaning up");
}

function spawnBuildProcess(container) {
    return new Promise((resolve, reject) => {
        //todo: dry run
        // const buildProcess = spawn(buildCommand,[
        //     "build",
        //     "--imageName",
        //     container.imageName,
        //     container.path
        // ],
        //{ stdio: "inherit" });
        const buildProcess = spawn("docker",[
            "buildx",
            "build",
            "--builder",
            "build",
            "--platform",
            platforms.join(','),
            "--tag",
            container.imageName,
            "--output",
            `type=image,push=${publish ? "true" : "false"},name=${container.imageName}`,
            (publish ? "--push" : ""),
            container.path
        ],
        { stdio: "inherit" });
        buildProcess.on("close", code => resolve(code));
        buildProcess.on("error", error => reject(error));
    })
}

function spawnCreateBuildContainer() {
    return new Promise((resolve, reject) => {
        const create = spawn("docker", [
            "buildx",
            "create",
            "--name",
            "build"
        ],
        { stdio: "inherit" });
        create.on("close", code => resolve(code));
        create.on("error", error => reject(error));
    });
}

function spawnRemoveBuildContainer() {
    return new Promise((resolve, reject) => {
        const rm = spawn("docker", [
            "buildx",
            "rm",
            "build"
        ],
        { stdio: "inherit" });
        rm.on("close", code => resolve(code));
        rm.on("error", error => reject(error));
    });
}

function spawnPublishProcess(container) {
    return new Promise((resolve, reject) => {
        //todo: dry run
        const buildProcess = spawn("docker",[
            "push",
            container.imageName
        ],
        { stdio: "inherit" });
        buildProcess.on("close", code => resolve(code));
        buildProcess.on("error", error => reject(error));
    })
}

function sortContainers(containers) {
    //get list of container names in project to filter out external dependencies
    //we are only concerned about sorting the build order for project dependencies
    const internalDepends = containers.map(c => c.imageName);

    //create dependency list
    const depencyList = new Map();
    containers.filter(container => internalDepends.find(d => d === container.depends) !== undefined)
        .forEach(container => {
            depencyList.set(container.imageName, container.depends);
        });

    
    //initialize adjaceny list and dependency counts
    const dependentList = new Map();
    const dependencyCounts = new Map();
    containers.forEach(container => {
        dependencyCounts.set(container.imageName, 0);
        dependentList.set(container.imageName, new Set());
    });

    //generate adjaceny list and calculate number of dependencies
    depencyList.forEach((dependency, name) => {
        const currentCount = dependencyCounts.get(name)
        dependencyCounts.set(name, currentCount  + 1);
        dependentList.set(dependency, dependentList.get(dependency).add(name));
    });

    //create visitor queue starting with the containers with zero dependencies
    let queue = [];
    dependencyCounts.forEach((count, name) => {
        if (count === 0) {
            queue.push(name);
        }
    });

    const order = []; 
    while(queue.length !== 0) {
        //add each que as the next level in the build order
        order.push(queue);
        let nextQueue = [];

        queue.forEach(name => {
            //visit each dependent for every node in the current que
            const dependents = dependentList.get(name);
            dependents.forEach(dependent => {
                //decrement the dependency count and add the dependent to the next que
                const dependencyCount = dependencyCounts.get(dependent);
                dependencyCounts.set(dependent, dependencyCount - 1);
                if (dependencyCounts.get(dependent) === 0) {
                    nextQueue.push(dependent);
                }
            })
        });

        queue = nextQueue;
    }

    return order;
}

await build();
