import fs from "fs/promises";
import path from "path";
import * as core from "@actions/core";
import { Api } from "./dockerhub";

export async function updateDockerhubRepository(namespace: string, repository: string, description: string, fullDescriptionPath: string, token: string) {
    core.info(`Updating repository ${namespace}/${repository}`);
    core.info(`Description: ${description}`);
    core.info(`Full description path: ${fullDescriptionPath}`)

    const fullDescription = await readFile(fullDescriptionPath);
    
    const response = await Api("PATCH", `repositories/${namespace}/${repository}`, {
        "description": description,
        "full_description": fullDescription,
    }, {
        username: namespace,
        token: token
    });

    switch (response.status) {
        case 200:
            core.info("Repository updated successfully");
            break;
        default:
            const body = JSON.parse(response.body);
            core.setFailed(body.message);
            break;
    }
}

async function readFile(relativePath: string) {
    const absolutePath = path.join(process.env["GITHUB_WORKSPACE"] ?? "", relativePath);
    return (await fs.readFile(absolutePath)).toString();
}
