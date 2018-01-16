import { Logger } from "../../root/interfaces";
import { MinimalResponseHandler } from "../interfaces";
import { SimpleVoiceResponse } from "./simple-voice-response";

export class EmptyResponse extends SimpleVoiceResponse {
  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean, logger: Logger) {
    super(handler, failSilentlyOnUnsupportedFeatures, logger);
    this.endSessionWith("");
  }
}