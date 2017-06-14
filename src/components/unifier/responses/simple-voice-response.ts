import { MinimalRequestExtraction, Voiceable } from "../interfaces";
import { BaseResponse } from "./base-response";

export class SimpleVoiceResponse extends BaseResponse implements Voiceable {
  constructor(extraction: MinimalRequestExtraction) {
    super(extraction);
  }

  endSessionWith(text: string) {
    this.handler.endSession = true;
    this.prompt(text);
  }

  prompt(text: string) {
    this.handler.voiceMessage = text;
    this.handler.sendResponse();
  }
}