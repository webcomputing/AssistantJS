import { MinimalRequestExtraction, Voiceable } from "../interfaces";
import { BaseResponse } from "./base-response";

export class VoiceResponse extends BaseResponse implements Voiceable {
  simple: Voiceable;
  ssml: Voiceable;

  constructor(extraction: MinimalRequestExtraction, simple: Voiceable, ssml: Voiceable) {
    super(extraction);
    this.simple = simple;
    this.ssml = ssml;
  }

  endSessionWith(text: string) {
    this.delegatorBasedOnInput(text).endSessionWith(text);
  }

  prompt(text: string) {
    this.delegatorBasedOnInput(text).prompt(text);
  }

  delegatorBasedOnInput(text: string) {
    if (text.includes("</")) {
      return this.ssml;
    } else {
      return this.simple;
    }
  }
}