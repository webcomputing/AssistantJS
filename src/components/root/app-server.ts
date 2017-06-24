import { MainApplication, Container } from "ioc-container";
import * as express from "express";
import { Express } from "express";
export { Express } from "express";
import * as bodyParser from "body-parser";
import { log } from "../../setup";

import { ResponseCallback, RequestContext } from "./interfaces";
import { GenericRequestHandler } from "./generic-request-handler";

export class ServerApplication implements MainApplication {
  private app: express.Express;
  private listeningCallback = (app: ServerApplication) => {};
  private expressRunningInstance;

  constructor (listeningCallback = (app: ServerApplication) => {}, expressApp: Express = express(), registerOwnMiddleware = true) {
    this.listeningCallback = listeningCallback;
    this.app = expressApp;

    if (registerOwnMiddleware) {
      log("Initializing express instance...");
      this.configureExpressApp();
    }
  }


  /** Starts express server, calls handleRequest on each request */
  execute(container: Container) {
    log("Registering express catch all route...");
    this.app.all("*", (request, response) => {
      this.handleRequest(request, response, container);
    });

    log("Starting express server...");
    this.expressRunningInstance = this.app.listen(3000, () => {
      log("Server is running.");
      this.listeningCallback(this);
    });
  }

  /** Binds GenericRequestHandler to request after extracting context */
  handleRequest(request: express.Request, response: express.Response, container: Container) {
    // Create generic request context
    let requestContext: RequestContext = {
      path: request.path,
      method: request.method,
      headers: request.headers as any,
      body: request.body,
      responseCallback: this.createResponseCallback(response)
    };

    // Call express independent request handler with this context
    this.getGenericRequestHandler(container).execute(requestContext, container);
  }

  /** Returns a callback function which can be used to response to a request */
  createResponseCallback(response: express.Response): ResponseCallback {
    return (body, headers, statusCode = 200) => {
      if (typeof headers !== "undefined") {
        Object.keys(headers).forEach((key) => {
          response.setHeader(key, headers[key]);
        });
      }

      response.status(statusCode).send(body);
    }
  }

  /** Stops the server */
  stop() {
    if (typeof this.expressRunningInstance !== "undefined") { 
      this.expressRunningInstance.close();
    }
  }

  /** Configures middleware for express app */
  configureExpressApp() {
    this.app.use(bodyParser());
  }

  private getGenericRequestHandler(container: Container) {
    return container.inversifyInstance.get(GenericRequestHandler);
  }
}