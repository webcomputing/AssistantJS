import { Logger } from "../../root/public-interfaces";
import { MinimalResponseHandler, OptionalHandlerFeatures, Voiceable } from "../public-interfaces";
import { BaseResponse } from "./base-response";
import { VoiceResponse } from "./voice-response";

export class UnauthenticatedResponse extends BaseResponse {
  /** Response handler of the currently used platform */
  protected handler!: MinimalResponseHandler & OptionalHandlerFeatures.Authentication;

  constructor(handler: MinimalResponseHandler, voiceResponse: VoiceResponse, failSilentlyOnUnsupportedFeatures: boolean, logger: Logger, text: string = "") {
    super(handler, failSilentlyOnUnsupportedFeatures, logger);

    this.reportIfUnavailable(
      OptionalHandlerFeatures.FeatureChecker.AuthenticationHandler,
      "The currently used platform does not allow sending authentication failures."
    );

    this.handler.forceAuthenticated = true;

    voiceResponse.endSessionWith(text);
  }
}
