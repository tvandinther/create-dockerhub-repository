import nock from "nock";
import { run } from "../src/index";

const fs = require("fs/promises");
const https = require("https");
const core = require("@actions/core");

jest.mock("fs/promises");
jest.mock("@actions/core");
jest.mock("https");



type RawTestInputs = {
    namespace: string,
    repository: string,
    private: boolean,
    description: string,
    fullDescriptionPath: string,
    token: string,
}

const mockReadFile = (actualFilename: string, actualContents: string) => jest.fn((fileName: string): Buffer => {
    console.log("filename: " + fileName)
    console.log("actualFilename: " + actualFilename)
    if (fileName == actualFilename) return Buffer.from(actualContents);
        else throw new Error("File not found");
});

const mockGetInput = (actual: RawTestInputs) => jest.fn((key: string): RawTestInputs[keyof RawTestInputs] | undefined => {
    return ({
        "namespace": actual.namespace,
        "repository": actual.repository,
        "private": JSON.stringify(actual.private),
        "description": actual.description,
        "full_description_path": actual.fullDescriptionPath,
        "token": actual.token,
    })[key];
});

test('test 1', async () => {
    const actual = {
        namespace: "namespace",
        repository: "repository",
        private: false,
        description: "description",
        fullDescriptionPath: "full_description_path",
        token: "abcd1234",
        fullDescriptionContents: "test",
        jwt: "sdkfmskmfksdmflsdk32323",
    }

    fs.readFile = mockReadFile(actual.fullDescriptionPath, actual.fullDescriptionContents);
    core.getInput = mockGetInput(actual);
    
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

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.setSecret).toHaveBeenCalledWith("abcd1234");
    expect(loginRequest.isDone()).toBe(true);
    expect(createRequest.isDone()).toBe(true);
    expect(updateRequest.isDone()).toBe(true);
});
