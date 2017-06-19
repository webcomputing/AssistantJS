import * as request from "request-promise";
export { RequestPromise } from "request-promise";
import { Container } from "ioc-container";
import * as express from "express";
import * as timeout from "connect-timeout";

import { AssistantJSSetup } from "../../../src/setup";
import { SpecSetup } from "../../../src/spec-setup";

/** Proxy for request-promise to use in combination with running server */
export class RequestProxy {
  get(path, headers = {}) {
    return request({uri: `http://localhost:3000${path}`, simple: false, headers: headers, resolveWithFullResponse: true});
  }

  post(path, body, headers = {}) {
    return request.post({uri: `http://localhost:3000${path}`, simple: false, body: body, headers: headers, resolveWithFullResponse: true, json: true});
  }
}

export function withServer(assistantJs: AssistantJSSetup, expressApp: express.Express = express()): Promise<[RequestProxy, Function]> {
  let specSetup = new SpecSetup(assistantJs);

  return specSetup.withServer(expressApp).then(stopFunction => {
    return [new RequestProxy(), stopFunction];
  });
}

export function expressAppWithTimeout(length = "5s") {
  const app = express();
  app.use(timeout(length));
  app.use(function(req, res, next) {
    next();
    if (!(req as any).timedout) res.send("");
  });
  return app;
}