import { MinimalResponseHandler } from "../../../../src/components/unifier/interfaces";
import { RequestContext } from "../../../../src/components/root/interfaces";
import { injectable, inject } from "inversify";

@injectable()
export class ResponseHandler implements MinimalResponseHandler {
  endSession: boolean = false;
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