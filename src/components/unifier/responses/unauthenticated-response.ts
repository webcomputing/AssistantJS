import { MinimalResponseHandler, OptionalHandlerFeatures, Voiceable } from "../interfaces";
import { VoiceResponse } from "./voice-response";
import { BaseResponse } from "./base-response";

export class UnauthenticatedResponse extends BaseResponse {
  constructor(handler: MinimalResponseHandler, voiceResponse: VoiceResponse, text: string = "") {
    super(handler);

    this.reportIfUnavailable(OptionalHandlerFeatures.FeatureChecker.AuthenticationHandler, "The currently used platform does not allow sending authentication failures.");
    
    (this.handler as OptionalHandlerFeatures.AuthenticationHandler).forceAuthenticated = true;

    voiceResponse.endSessionWith(text);
  }
}