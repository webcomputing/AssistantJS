import { MinimalResponseHandler, Voiceable } from "../interfaces";
import { BaseResponse } from "./base-response";

export class VoiceResponse extends BaseResponse implements Voiceable {
  simple: Voiceable;
  ssml: Voiceable;

  constructor(handler: MinimalResponseHandler, simple: Voiceable, ssml: Voiceable) {
    super(handler);
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
    if (text.includes("</") || text.includes("/>")) {
      return this.ssml;
    } else {
      return this.simple;
    }
  }
}