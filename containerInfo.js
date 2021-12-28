import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import { parse as parseDockerfile } from 'docker-file-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const containerRepo = "some1one/containers";

async function getDevcontainerConfigPath(folder) {
    let hasConfigFile = false;
    let configFilePath = "";

    //.devcontainer/devcontainer.json has priority over .devcontainer.json so we check for it first
    const contents = await fs.readdir(folder);
    const devcontainerFolderName = contents.find(content => content === ".devcontainer");

    if(devcontainerFolderName !== undefined) {
        //check that .devcontainer is a folder
        const devcontainerPath = path.join(folder, devcontainerFolderName)
        const devContainerStats = await fs.stat(devcontainerPath);
        const devcontainerIsFolder = !devContainerStats.isFile();

        if(devcontainerIsFolder) {
            //check if .devcontainer contains devcontainer.json
            const devcontainerFolderContents = await fs.readdir(devcontainerPath);
            const devcontainerFolderConfigName = devcontainerFolderContents.find(content => content === "devcontainer.json");

            if(devcontainerFolderConfigName !== undefined) {
                //check that .devcontainer/devcontainer.json is a file
                const configPath = path.join(devcontainerPath, devcontainerFolderConfigName)
                const configStats = await fs.stat(configPath);
                const configIsFile = configStats.isFile();

                if(configIsFile) {
                    //everything checks out, select .devcontainer/devcontainer.json as the config file
                    hasConfigFile = true;
                    configFilePath = configPath;
                }
            }
        }
    }

    //if .devcontainer/devcontainer.json was not found
    if(!hasConfigFile) {
        //check for .devcontainer.json
        const devcontainerConfigName = contents.find(content => content == ".devcontainer.json");
        if(devcontainerConfigName !== null) {
            //check if .devcontainer.json is a file
            const devcontainerConfigPath = path.join(folder, devcontainerConfigName);
            const devcontainerConfigStats = await fs.stat(devcontainerConfigPath);
            const devcontainerConfigIsFile = devcontainerConfigStats.isFile();

            if(devcontainerConfigIsFile) {
                //everything checks out, select .devcontainer.json as the config file
                hasConfigFile = true;
                configFilePath = devcontainerConfigPath;
            }
        }
    }

    return hasConfigFile ? configFilePath : undefined;
}

async function getDependsOnImageName(configPath) {
    let dependsOnImageName = undefined;
    try {
        const rawConfig = await fs.readFile(configPath, { encoding: "utf-8" });
        const config = JSON.parse(rawConfig);

        //empty config
        if(config === undefined) return undefined;

        //build has priority over image so check that first
        if(config.build !== undefined && config.build.dockerfile !== undefined) {
            //check if docker file exists
            const folder = path.dirname(configPath);
            const folderContents = await fs.readdir(folder);
            const dockerfile = folderContents.find(content => content === config.build.dockerfile);
            if(dockerfile !== undefined) {
                //check that dockerfile is a file
                const dockerfilePath = path.join(folder, dockerfile);
                const dockerfileStats = await fs.stat(dockerfilePath);
                const isFile = dockerfileStats.isFile();
                if(isFile){
                    return await getDockerfileDepends(dockerfilePath);
                }
            }
        }
        //dockerfile setting not found, check for config image
        else if(config.image !== undefined) {
            return config.image;
        }
    }
    catch {
        return undefined;
    }

    return undefined;
}

async function getDockerfileDepends(path) {
    const raw = await fs.readFile(path, { encoding: "utf-8" });
    const commands = parseDockerfile(raw);

    //first command should always be FROM, if it will be used
    if(commands[0].name === "FROM") {
        return commands[0].args;
    }

    return undefined;
}

export default async function getContainerInfo() {
    const src = path.join(__dirname, "src");
    const contents = await fs.readdir(src);
    const statChecked = await Promise.all(
        contents.map(async name => {
            const contentPath = path.join(src, name);
            const stat = await fs.lstat(contentPath);
            return { path: contentPath, isFolder: !stat.isFile() };
        }));

    const folders = statChecked
        .filter(content => content.isFolder)
        .map(content => content.path);
    
    return Promise.allSettled(folders.map(async folder => {
        const folderName = path.basename(folder);
        const configPath = await getDevcontainerConfigPath(folder);
        const depends = await getDependsOnImageName(configPath);

        return {
            path: folder,
            folderName,
            name: `vsc-${folderName}`,
            repo: containerRepo,
            tag: `vsc-${folderName}`,
            imageName: `${containerRepo}:vsc-${folderName}`,
            configPath,
            depends
        }
    }));
}
