import { MinimalResponseHandler, OptionalHandlerFeatures, Voiceable } from "../interfaces";
import { VoiceResponse } from "./voice-response";
import { BaseResponse } from "./base-response";

export class UnauthenticatedResponse extends BaseResponse {
  handler: MinimalResponseHandler & OptionalHandlerFeatures.AuthenticationHandler;

  constructor(handler: MinimalResponseHandler, voiceResponse: VoiceResponse, failSilentlyOnUnsupportedFeatures: boolean, text: string = "") {
    super(handler, failSilentlyOnUnsupportedFeatures);

    this.reportIfUnavailable(OptionalHandlerFeatures.FeatureChecker.AuthenticationHandler, "The currently used platform does not allow sending authentication failures.");
    
    this.handler.forceAuthenticated = true;

    voiceResponse.endSessionWith(text);
  }
}