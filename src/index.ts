import * as core from "@actions/core";
import { z } from "zod";
import { fromZodError } from 'zod-validation-error';
import { createDockerhubRepository } from "./createDockerhubRepository";
import { updateDockerhubRepository } from "./updateDockerhubRepository";
import { fileURLToPath } from "url";

export async function run() {
    const rawInput = {
        namespace: core.getInput("namespace"),
        repository: core.getInput("repository"),
        isPrivate: getBooleanInput("private") ?? false,
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
    console.log(result);
    if (!result.success) {
        core.setFailed(fromZodError(result.error));
    } else {
        const input = result.data;
    
        core.setSecret(input.token);
    
        try {
            await createDockerhubRepository(input.namespace, input.repository, input.description, input.isPrivate, input.token);    
            await updateDockerhubRepository(input.namespace, input.repository, input.description, input.fullDescriptionPath, input.token);
            core.info("Done");
        } catch (error: unknown) {
            handleError(error);
        }
    }
}

function handleError(error: unknown): never {
    if (error instanceof Error) {
        core.setFailed(error.stack ?? error.message)
    } else {
        core.setFailed(`Unknown error ${error}`);
    }
    // Unreachable due to process.exit(1) in setFailed
    throw error;
}

function getBooleanInput(name: string): boolean | undefined {
    try {
        const input = core.getInput(name);
        return z.boolean().parse(JSON.parse(input));
    } catch (error: unknown) {
        handleError(error);
    }
}

if (require.main === module) {
    run();
}
