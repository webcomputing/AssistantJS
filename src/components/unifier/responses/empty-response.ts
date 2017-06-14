import { MinimalRequestExtraction } from "../interfaces";
import { SimpleVoiceResponse } from "./simple-voice-response";

export class EmptyResponse extends SimpleVoiceResponse {
  constructor(extraction: MinimalRequestExtraction) {
    super(extraction);
    this.endSessionWith("");
  }
}