import { MinimalRequestExtraction, OptionalHandlerFeatures } from "../interfaces";
import { SimpleVoiceResponse } from "./simple-voice-response";

export class SSMLResponse extends SimpleVoiceResponse {
  constructor(extraction: MinimalRequestExtraction) {
    super(extraction);
    
    if (!this.featureIsAvailable(OptionalHandlerFeatures.FeatureChecker.SSMLHandler))
      throw new Error("SSML Feature is not available for this response handler: " + this.handler);
    
    (this.handler as OptionalHandlerFeatures.SSMLHandler).isSSML = true;
  }
}