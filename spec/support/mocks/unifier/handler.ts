import { inject, injectable } from "inversify";
import { RequestContext } from "../../../../src/components/root/public-interfaces";
import { MinimalResponseHandler } from "../../../../src/components/unifier/public-interfaces";

@injectable()
export class ResponseHandler implements MinimalResponseHandler {
  public endSession: boolean = false;
  public voiceMessage: string = "";
  public sendResponse() {}
}

@injectable()
export class RealResponseHandler extends ResponseHandler {
  public context: RequestContext;

  constructor(@inject("core:root:current-request-context") context: RequestContext) {
    super();
    this.context = context;
  }

  public sendResponse() {
    // Respond in a chaotic order to test against race conditions
    setTimeout(() => {
      this.context.responseCallback(this.voiceMessage);
    }, Math.random() * 1000);
  }
}
