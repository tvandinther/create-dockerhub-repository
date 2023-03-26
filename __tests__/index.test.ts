const fs = require("fs/promises");
const https = require("https");
const core = require("@actions/core");
const { run } = require("../src/index");

jest.mock("fs/promises");
jest.mock("https");

test('test 1', async () => {
    fs.readFile.mockResolvedValue(Buffer.from("test"));
    setInput("namespace", "namespace");
    setInput("repository", "repository");
    setInput("private", "false");
    setInput("description", "description");
    setInput("full_description_path", "full_description_path");
    setInput("token", "token");

    await run();

    expect(core.setFailed).not.toHaveBeenCalled();
    expect(core.setSecret).toHaveBeenCalledWith("token");
    expect(fs.readFile).toHaveBeenCalledWith("full_description_path");
    expect(https.request).toHaveBeenCalledTimes(2);
    expect(https.request).toHaveBeenCalledWith({
        hostname: "hub.docker.com",
        path: "/v2/repositories/namespace/repository/",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": 0,
        },
    }, expect.any(Function));
});

function setInput(name: string, value: string) {
    process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] = value;
}