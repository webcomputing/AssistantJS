import { inject, injectable } from "inversify";
import { ExecutableExtension } from "inversify-components";

import { MinimalResponseHandler } from "./interfaces";
import { ResponseCallback, RequestContext } from "../root/interfaces";

@injectable()
/** Take this class as base class for implementing response handler, if needed */
export abstract class AbstractResponseHandler implements MinimalResponseHandler {
  private _isActive: boolean = true;

  endSession: boolean;
  voiceMessage: string | null = null;

  responseCallback: ResponseCallback;
  killSession: () => Promise<void>;
  
  constructor(
    @inject("core:root:current-request-context") extraction: RequestContext,
    @inject("core:unifier:current-kill-session-promise") killSession: () => Promise<void>
  ) {
    this.responseCallback = extraction.responseCallback;
    this.killSession = killSession;
  }

  get isActive() {
    return this._isActive;
  }

  sendResponse() {
    this.failIfInactive();

    this.responseCallback(JSON.stringify(this.getBody()), this.getHeaders());
    if (this.endSession) {
      this.killSession();
    }

    this._isActive = false;
  }

  /** Headers of response, default is Contet-Type only */
  getHeaders() {
    return { "Content-Type": "application/json" };
  }

  /** Body of response, you need to implement this method */
  abstract getBody(): any;

  private failIfInactive() {
    if (!this.isActive) {
      throw Error("This handle is already inactive, an response was already sent. You cannot send text to alexa multiple times in one request.");
    }
  }
}