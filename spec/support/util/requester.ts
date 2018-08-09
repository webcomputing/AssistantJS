import * as express from "express";
import * as request from "request-promise";

import { AssistantJSSetup } from "../../../src/setup";
import { SpecHelper } from "../../../src/spec-helper";

/** Proxy for request-promise to use in combination with running server */
export class RequestProxy {
  public get(path, headers = {}) {
    return request({ uri: `http://localhost:3000${path}`, simple: false, headers, resolveWithFullResponse: true });
  }

  public post(path, body, headers = {}) {
    return request.post({ uri: `http://localhost:3000${path}`, simple: false, body, headers, resolveWithFullResponse: true, json: true });
  }
}

export async function withServer(assistantJs: AssistantJSSetup, expressApp: express.Express = express()): Promise<[RequestProxy, () => void]> {
  const specSetup = new SpecHelper(assistantJs);
  const stopFunction = await specSetup.withServer(expressApp);
  return [new RequestProxy(), stopFunction];
}
