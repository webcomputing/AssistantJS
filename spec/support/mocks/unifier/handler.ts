import { inject, injectable } from "inversify";
import { RequestContext } from "../../../../src/components/root/public-interfaces";
import { MinimalResponseHandler, OptionalHandlerFeatures } from "../../../../src/components/unifier/public-interfaces";

@injectable()
export class ResponseHandler implements MinimalResponseHandler, OptionalHandlerFeatures.SessionData {
  public sessionData = null;
  public endSession: boolean = false;
  public voiceMessage: string = "";

  // tslint:disable-next-line:no-empty
  public sendResponse() {}
}

// tslint:disable-next-line:max-classes-per-file
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
