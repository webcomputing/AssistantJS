import { MinimalResponseHandler, OptionalHandlerFeatures } from "../interfaces";
import { SimpleVoiceResponse } from "./simple-voice-response";

export class SSMLResponse extends SimpleVoiceResponse {
  constructor(handler: MinimalResponseHandler) {
    super(handler);
    
    this.reportIfUnavailable(OptionalHandlerFeatures.FeatureChecker.SSMLHandler, "The currently selected platform does not allow SSML.");
  }

  /** Sets <speak></speak> around text and enables ssml*/
  protected prepareText(text: string) {
    (this.handler as OptionalHandlerFeatures.SSMLHandler).isSSML = true;
    return "<speak>" + text + "</speak>";
  }
}