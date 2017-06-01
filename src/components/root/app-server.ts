import { MainApplication, Container } from "ioc-container";
import * as express from "express";
import { log } from "../../globals";

import { ResponseCallback, RequestContext } from "./interfaces";
import { GenericRequestHandler } from "./generic-request-handler";

const app = express();

export class ServerApplication implements MainApplication {
  private listeningCallback = () => {};

  constructor (listeningCallback = () => {}) {
    this.listeningCallback = listeningCallback;
  }


  /** Starts express server, calls handleRequest on each request */
  public execute(container: Container) {
    log("Registering express catch all route...");
    app.get("*", (request, response) => {
      this.handleRequest(request, response, container);
    });

    log("Starting express server...");
    app.listen(3000, () => {
      log("Server is running.");
      this.listeningCallback();
    });
  }

  /** Binds GenericRequestHandler to request after extracting context */
  handleRequest(request: express.Request, response: express.Response, container: Container) {
    // Create generic request context
    let requestContext: RequestContext = {
      path: request.path,
      method: request.method,
      headers: request.headers,
      body: request.body,
      responseCallback: this.createResponseCallback(response)
    };

    // Call express independent request handler with this context
    this.getGenericRequestHandler(container).execute(requestContext, container);
  }

  /** Returns a callback function which can be used to response to a request */
  createResponseCallback(response: express.Response): ResponseCallback {
    return (body, headers) => {
      if (typeof headers !== "undefined") {
        Object.keys(headers).forEach((key) => {
          response.setHeader(key, headers[key]);
        });
      }

      response.send(body);
    }
  }

  private getGenericRequestHandler(container: Container) {
    return container.inversifyInstance.get(GenericRequestHandler);
  }
}