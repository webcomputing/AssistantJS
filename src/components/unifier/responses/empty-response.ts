import { Logger } from "../../root/public-interfaces";
import { MinimalResponseHandler } from "../public-interfaces";
import { SimpleVoiceResponse } from "./simple-voice-response";

export class EmptyResponse extends SimpleVoiceResponse {
  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean, logger: Logger) {
    super(handler, failSilentlyOnUnsupportedFeatures, logger);
    this.endSessionWith("");
  }
}
