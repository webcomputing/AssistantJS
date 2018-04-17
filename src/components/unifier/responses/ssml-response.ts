import { Logger } from "../../root/public-interfaces";
import { MinimalResponseHandler, OptionalHandlerFeatures } from "../public-interfaces";
import { SimpleVoiceResponse } from "./simple-voice-response";

export class SSMLResponse extends SimpleVoiceResponse {
  /** Response handler of the currently used platform */
  protected handler!: MinimalResponseHandler & OptionalHandlerFeatures.SSML & OptionalHandlerFeatures.Reprompt;

  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean, logger: Logger) {
    super(handler, failSilentlyOnUnsupportedFeatures, logger);

    this.reportIfUnavailable(OptionalHandlerFeatures.FeatureChecker.SSMLHandler, "The currently selected platform does not allow SSML.");
  }

  /** Sets <speak></speak> around text and enables ssml*/
  protected prepareText(text: string) {
    this.handler.isSSML = true;
    return "<speak>" + text + "</speak>";
  }
}
