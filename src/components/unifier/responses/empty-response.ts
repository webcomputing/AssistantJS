import { MinimalResponseHandler } from "../interfaces";
import { SimpleVoiceResponse } from "./simple-voice-response";

export class EmptyResponse extends SimpleVoiceResponse {
  constructor(handler: MinimalResponseHandler) {
    super(handler);
    this.endSessionWith("");
  }
}