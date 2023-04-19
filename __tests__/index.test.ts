import nock from "nock";
import { run } from "../src/index";
import path from "path";
import fs from "fs/promises";
import * as core from "@actions/core";

jest.mock("fs/promises");
jest.mock("@actions/core", () => {
    const allAutoMocked = jest.createMockFromModule<typeof import("@actions/core")>("@actions/core");
    const actual = jest.requireActual<typeof import("@actions/core")>("@actions/core");

    return {
        __esModules: true,
        ...allAutoMocked,
        getInput: actual.getInput,
    }
});
jest.mock("https");

type RawTestInputs = {
    namespace: string,
    repository: string,
    private: boolean,
    description: string,
    fullDescriptionPath: string,
    token: string,
}

type TestData = RawTestInputs & {
    fullDescriptionContents: string,
    jwt: string,
}

const mockReadFile = (actualFilename: string, actualContents: string) => {
    const workspacePath = path.join("github", "workspace");
    process.env["GITHUB_WORKSPACE"] = workspacePath;
    const actualFilepath = path.join(workspacePath, actualFilename);
    
    jest.spyOn(fs, "readFile").mockImplementation((filePath) => {
        console.log(path);
        console.log(actualFilename);
        if (filePath == actualFilepath) return Promise.resolve(Buffer.from(actualContents));
        else return Promise.reject(new Error("File not found"));
    });
};

const mockGetInput = (actual: RawTestInputs) => {
    jest.spyOn(core, "getInput");

    const setInput = (key: string, value: RawTestInputs[keyof RawTestInputs]) => {
        process.env[`INPUT_${key.replace(/ /g, "_").toUpperCase()}`] = value.toString();
    };

    setInput("namespace", actual.namespace);
    setInput("repository", actual.repository);
    setInput("private", actual.private.toString());
    setInput("description", actual.description);
    setInput("full_description_path", actual.fullDescriptionPath);
    setInput("token", actual.token);
};

function createTestData(overrides: Partial<TestData> = {}): TestData {
    return {
        namespace: "namespace",
        repository: "repository",
        private: false,
        description: "description",
        fullDescriptionPath: "full_description_path",
        token: "abcd1234",
        fullDescriptionContents: "test",
        jwt: "sdkfmskmfksdmflsdk32323",
        ...overrides,
    };
}

const setupRequests = (actual: TestData) => {
    const loginRequest = nock("https://hub.docker.com/")
        .post('/v2/users/login', { username: actual.namespace, password: actual.token })
        .reply(200, { token: actual.jwt });
    const createRequest = nock("https://hub.docker.com/")
        .matchHeader("Authorization", `JWT ${actual.jwt}`)
        .post('/v2/repositories', { namespace: actual.namespace, name: actual.repository, description: actual.description, is_private: actual.private, registry: "docker" })
        .reply(201);
    const updateRequest = nock("https://hub.docker.com/")
        .matchHeader("Authorization", `JWT ${actual.jwt}`)
        .patch(`/v2/repositories/${actual.namespace}/${actual.repository}`, { description: actual.description, full_description: actual.fullDescriptionContents })
        .reply(200);

    return { loginRequest, createRequest, updateRequest };
}

const initialise = (overrides: Partial<TestData> = {}) => {
    const actual = createTestData(overrides);

    mockReadFile(actual.fullDescriptionPath, actual.fullDescriptionContents);
    mockGetInput(actual);

    const requests = setupRequests(actual);

    return { actual, requests };
}

afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    nock.cleanAll();
});

test('Create new Dockerhub repository w/ description & full description', async () => {
    const { actual, requests } = initialise(); 
    const { loginRequest, createRequest, updateRequest } = requests;

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.setSecret).toHaveBeenCalledWith("abcd1234");
    expect(loginRequest.isDone()).toBe(true);
    expect(createRequest.isDone()).toBe(true);
    expect(updateRequest.isDone()).toBe(true);
});
