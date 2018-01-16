import { Logger } from "../../root/interfaces";
import { MinimalResponseHandler, OptionalHandlerFeatures, Voiceable } from "../interfaces";
import { VoiceResponse } from "./voice-response";
import { BaseResponse } from "./base-response";

export class UnauthenticatedResponse extends BaseResponse {
  /** Response handler of the currently used platform */
  protected handler: MinimalResponseHandler & OptionalHandlerFeatures.AuthenticationHandler;

  constructor(handler: MinimalResponseHandler, voiceResponse: VoiceResponse, failSilentlyOnUnsupportedFeatures: boolean, logger: Logger, text: string = "") {
    super(handler, failSilentlyOnUnsupportedFeatures, logger);

    this.reportIfUnavailable(OptionalHandlerFeatures.FeatureChecker.AuthenticationHandler, "The currently used platform does not allow sending authentication failures.");
    
    this.handler.forceAuthenticated = true;

    voiceResponse.endSessionWith(text);
  }
}