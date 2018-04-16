import { MinimalResponseHandler, Voiceable } from "../public-interfaces";
import { BaseResponse } from "./base-response";

export class VoiceResponse implements Voiceable {
  private simple: Voiceable;
  private ssml: Voiceable;

  constructor(simple: Voiceable, ssml: Voiceable) {
    this.simple = simple;
    this.ssml = ssml;
  }

  public endSessionWith(text: string) {
    this.delegatorBasedOnInput(text).endSessionWith(text);
  }

  public prompt(text: string, ...reprompts: string[]) {
    this.delegatorBasedOnInput(text).prompt(text, ...reprompts);
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
