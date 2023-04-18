import * as core from "@actions/core";
import { Api } from "./dockerhub"

export async function createDockerhubRepository(namespace: string, repository: string, description: string, isPrivate: boolean, token: string) {
    core.info(`Creating repository ${namespace}/${repository}`);
    core.info(`Description: ${description}`);
    core.info(`private: ${isPrivate}`);
    
    const response = await Api("POST", "repositories", {
        namespace: namespace,
        name: repository,
        description: description,
        is_private: isPrivate,
        registry: "docker",
    }, {
        username: namespace,
        token: token
    });

    switch (response.status) {
        case 201:
            core.info("Repository created successfully");
            break;
        case 400:
            core.info("Repository already exists");
            break;
        default:
            const body = JSON.parse(response.body);
            core.setFailed(body.message);
            break;
    }
}
