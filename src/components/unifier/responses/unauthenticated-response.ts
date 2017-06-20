import { MinimalResponseHandler, OptionalHandlerFeatures, Voiceable } from "../interfaces";
import { VoiceResponse } from "./voice-response";
import { BaseResponse } from "./base-response";

export class UnauthenticatedResponse extends BaseResponse {
  constructor(handler: MinimalResponseHandler, voiceResponse: VoiceResponse, text: string = "") {
    super(handler);
    
    if (!this.featureIsAvailable(OptionalHandlerFeatures.FeatureChecker.AuthenticationHandler))
      throw new Error("Unauthentication Feature is not available for this response handler: " + this.handler);
    
    (this.handler as OptionalHandlerFeatures.AuthenticationHandler).forceAuthenticated = true;

    voiceResponse.endSessionWith(text);
  }
}