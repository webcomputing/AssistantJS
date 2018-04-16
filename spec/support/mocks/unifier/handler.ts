import { inject, injectable } from "inversify";
import { RequestContext } from "../../../../src/components/root/public-interfaces";
import { MinimalResponseHandler } from "../../../../src/components/unifier/public-interfaces";

@injectable()
export class ResponseHandler implements MinimalResponseHandler {
  endSession: boolean = false;
  requestTimestamp: Date = new Date();
  voiceMessage: string = "";
  sendResponse() {}
}

@injectable()
export class RealResponseHandler extends ResponseHandler {
  context: RequestContext;

  constructor(@inject("core:root:current-request-context") context: RequestContext) {
    super();
    this.context = context;
  }

  sendResponse() {
    // Respond in a chaotic order to test against race conditions
    setTimeout(() => {
      this.context.responseCallback(this.voiceMessage);
    }, Math.random()*1000);
  }
}