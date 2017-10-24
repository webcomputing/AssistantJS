import { MinimalResponseHandler } from "../interfaces";
import { SimpleVoiceResponse } from "./simple-voice-response";

export class EmptyResponse extends SimpleVoiceResponse {
  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean) {
    super(handler, failSilentlyOnUnsupportedFeatures);
    this.endSessionWith("");
  }
}