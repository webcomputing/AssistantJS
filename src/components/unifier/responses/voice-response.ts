import { MinimalResponseHandler, Voiceable } from "../interfaces";
import { BaseResponse } from "./base-response";

export class VoiceResponse implements Voiceable {
  private simple: Voiceable;
  private ssml: Voiceable;

  constructor(simple: Voiceable, ssml: Voiceable) {
    this.simple = simple;
    this.ssml = ssml;
  }

  endSessionWith(text: string) {
    this.delegatorBasedOnInput(text).endSessionWith(text);
  }

  prompt(text: string) {
    this.delegatorBasedOnInput(text).prompt(text);
  }

  private delegatorBasedOnInput(text: string) {
    if (typeof text === "undefined" || text === null) text = "";
    
    if (text.includes("</") || text.includes("/>")) {
      return this.ssml;
    } else {
      return this.simple;
    }
  }
}