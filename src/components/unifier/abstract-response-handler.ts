import { inject, injectable, multiInject, optional } from "inversify";
import { ExecutableExtension } from "inversify-components";
import * as util from "util";

import { RequestContext, ResponseCallback } from "../root/public-interfaces";
import { componentInterfaces } from "./private-interfaces";
import { AfterResponseHandler, BeforeResponseHandler, MinimalResponseHandler, ResponseHandlerExtensions } from "./public-interfaces";

@injectable() /** Take this class as base class for implementing response handler, if needed */
export abstract class AbstractResponseHandler implements MinimalResponseHandler {
  public endSession: boolean = false;
  public voiceMessage: string | null = null;

  public responseCallback: ResponseCallback;
  public killSession: () => Promise<void>;

  private canSendResponse: boolean = true;

  constructor(
    @inject("core:root:current-request-context") extraction: RequestContext,
    @inject("core:unifier:current-kill-session-promise") killSession: () => Promise<void>,
    @inject("core:unifier:response-handler-extensions") private responseHandlerExtensions: ResponseHandlerExtensions
  ) {
    this.responseCallback = extraction.responseCallback;
    this.killSession = killSession;
  }

  get isActive() {
    return this.canSendResponse;
  }

  public sendResponse() {
    this.failIfInactive();

    // to be backward-compatible first check if BeforeResponseHandlers are set,
    // because normal ResponseHandlers inherits from this AbstractResponseHandler and calls super().
    // This prevents DI and this.beforeSendResponseHandler are undefined
    if (this.responseHandlerExtensions) {
      this.responseHandlerExtensions.beforeExtensions.forEach(beforeResponseHandler => {
        beforeResponseHandler.execute(this);
      });
    }

    this.responseCallback(JSON.stringify(this.getBody()), this.getHeaders());
    if (this.endSession) {
      this.killSession();
    }

    this.canSendResponse = false;

    // to be backward-compatible first check if AfterResponseHandlers are set,
    // because normal ResponseHandlers inherits from this AbstractResponseHandler and calls super().
    // This prevents DI and this.afterSendResponseHandler are undefined
    if (this.responseHandlerExtensions) {
      this.responseHandlerExtensions.afterExtensions.forEach(afterResponseHandler => {
        afterResponseHandler.execute(this);
      });
    }
  }

  /** Headers of response, default is Contet-Type only */
  public getHeaders() {
    return { "Content-Type": "application/json" };
  }

  /** Body of response, you need to implement this method */
  public abstract getBody(): any;

  private failIfInactive() {
    if (!this.isActive) {
      throw Error(
        "This handle is already inactive, an response was already sent. You cannot send text to a platform multiple times in one request. Current response handler: " +
          util.inspect(this)
      );
    }
  }
}
