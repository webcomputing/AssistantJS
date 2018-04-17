import { Logger } from "../../root/public-interfaces";
import { MinimalResponseHandler, OptionalHandlerFeatures, Voiceable } from "../public-interfaces";
import { BaseResponse } from "./base-response";

export class SimpleVoiceResponse extends BaseResponse implements Voiceable {
  /** Response handler of the currently used platform */
  protected handler!: MinimalResponseHandler & OptionalHandlerFeatures.Reprompt;

  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean, logger: Logger) {
    super(handler, failSilentlyOnUnsupportedFeatures, logger);
  }

  public endSessionWith(text: string) {
    this.handler.endSession = true;
    this.handler.voiceMessage = this.prepareText(text);
    this.handler.sendResponse();
  }

  public prompt(text: string, ...reprompts: string[]) {
    this.handler.endSession = false;
    this.handler.voiceMessage = this.prepareText(text);
    this.attachRepromptsIfAny(reprompts);
    this.handler.sendResponse();
  }

  /** Attaches reprompts to handler */
  protected attachRepromptsIfAny(reprompts: string[] = []) {
    if (reprompts.length > 0) {
      this.reportIfUnavailable(OptionalHandlerFeatures.FeatureChecker.Reprompt, "The currently used platform does not support reprompting.");
      this.handler.reprompts = reprompts.map(reprompt => this.prepareText(reprompt));
    }
  }

  /** Easy overwrite functionality for text preprocessing */
  protected prepareText(text: string) {
    return text;
  }
}
