import core from "@actions/core";
import { z } from "zod";
import { createDockerhubRepository } from "./createDockerhubRepository";
import { updateDockerhubRepository } from "./updateDockerhubRepository";

const rawInput = {
    namespace: core.getInput("namespace"),
    repository: core.getInput("repository"),
    isPrivate: core.getInput("private"),
    description: core.getInput("description"),
    fullDescriptionPath: core.getInput("full_description_path"),
    token: core.getInput("token"),
}

const inputSchema = z.object({
    namespace: z.string(),
    repository: z.string(),
    isPrivate: z.boolean(),
    description: z.string(),
    fullDescriptionPath: z.string(),
    token: z.string(),
});

const result = inputSchema.safeParse(rawInput);
if (!result.success) {
    core.setFailed(result.error.message);
} else {
    const input = result.data;

    core.setSecret(input.token);

    try {
        await createDockerhubRepository(input.namespace, input.repository, input.description, input.isPrivate, input.token);    
        await updateDockerhubRepository(input.namespace, input.repository, input.description, input.fullDescriptionPath, input.token);
        core.info("Done");
    } catch (error: unknown) {
        if (error instanceof Error) {
            core.setFailed(error.message)
        } else {
            core.setFailed(`Unknown error ${error}`);
        }
    }
}

export { };
