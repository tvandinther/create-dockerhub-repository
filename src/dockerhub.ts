import https from "https";
import type { RequestOptions } from "https";
import type { IncomingMessage, OutgoingMessage } from "http";
const dockerhubApiUri = "https://hub.docker.com/v2/";
const authMap: Map<string, string> = new Map();

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

type JsonSerializable =
  | string
  | number
  | boolean
  | null
  | JsonSerializableArray
  | JsonSerializableObject;

interface JsonSerializableArray extends Array<JsonSerializable> {}
interface JsonSerializableObject {
  [key: string]: JsonSerializable;
}

type Auth = {
    username: string;
    token: string;
} | null;

type ApiResponse = {
    status?: number;
    body: string;
}

export async function Api(method: HttpMethod, path: string, body: JsonSerializable, auth: Auth = null) {
    const options: RequestOptions = new URL(path, dockerhubApiUri);
    options.method = method;
    options.headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };

    if (auth !== null) {
        options.headers["Authorization"] = `JWT ${(await Login(auth.username, auth.token))}`;
    }

    return new Promise<ApiResponse>((resolve, reject) => {
        const request: OutgoingMessage = https.request(options, (response: IncomingMessage) => {
            response.setEncoding("utf8");
            let body = "";

            response.on("data", (chunk) => {
                body += chunk;
            });

            response.on("end", () => {
                resolve({
                    status: response.statusCode,
                    body: body
                });
            });
        });

        request.on("error", (error) => {
            reject(error);
        });

        request.write(JSON.stringify(body));
        request.end();
    });
}

export async function Login(username: string, password: string) {
    if (authMap.has(username)) return authMap.get(username);

    const response = await Api("POST", "users/login/", {
        "username": username,
        "password": password
    });

    switch (response.status) {
        case 200:
            const token = (JSON.parse(response.body)).token;
            authMap.set(username, token);
            return token;
        default:
            throw new Error(`${response.status}: ${JSON.stringify(response.body)}`);
    }
}
