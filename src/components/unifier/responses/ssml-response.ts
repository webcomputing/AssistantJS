import { MinimalResponseHandler, OptionalHandlerFeatures } from "../interfaces";
import { SimpleVoiceResponse } from "./simple-voice-response";

export class SSMLResponse extends SimpleVoiceResponse {
  constructor(handler: MinimalResponseHandler) {
    super(handler);
    
    if (!this.featureIsAvailable(OptionalHandlerFeatures.FeatureChecker.SSMLHandler))
      throw new Error("SSML Feature is not available for this response handler: " + this.handler);
  }

  /** Sets <speak></speak> around text and enables ssml*/
  protected prepareText(text: string) {
    (this.handler as OptionalHandlerFeatures.SSMLHandler).isSSML = true;
    return "<speak>" + text + "</speak>";
  }
}