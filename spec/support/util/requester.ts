import * as request from "request-promise";
export { RequestPromise } from "request-promise";

import { run } from "../../../src/setup";
import { ServerApplication } from "../../../src/components/root/app-server";

/** Proxy for request-promise to use in combination with running server */
export class RequestProxy {
  get(path) {
    return request(`http://localhost:3000${path}`);
  }
}

export function withServer(): Promise<[RequestProxy, Function]> {
  return new Promise(resolve => {
    run(new ServerApplication((app) => {
      let stopServer = () => {
        app.stop();
      }
      resolve([new RequestProxy(), stopServer]);
    }));
  });
}