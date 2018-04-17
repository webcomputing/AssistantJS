import { MinimalResponseHandler, Voiceable } from "../public-interfaces";
import { BaseResponse } from "./base-response";

export class VoiceResponse implements Voiceable {
  private simple: Voiceable;
  private ssml: Voiceable;

  constructor(simple: Voiceable, ssml: Voiceable) {
    this.simple = simple;
    this.ssml = ssml;
  }

  public endSessionWith(text: string | Promise<string>) {
    if (typeof text === "string") {
      return (this.delegatorBasedOnInput(text) as Voiceable).endSessionWith(text);
    }
    return (this.delegatorBasedOnInput(text) as Promise<Voiceable>).then(voiceable => {
      return voiceable.endSessionWith(text);
    });
  }

  public prompt(text: string | Promise<string>, ...reprompts: Array<string | Promise<string>>) {
    if (typeof text === "string") {
      return (this.delegatorBasedOnInput(text) as Voiceable).prompt(text, ...reprompts);
    }
    return (this.delegatorBasedOnInput(text) as Promise<Voiceable>).then(voiceable => {
      return voiceable.prompt(text, ...reprompts);
    });
  }

  private delegatorBasedOnInput(text: string | Promise<string>) {
    if (typeof text !== "string") {
      return text.then(value => {
        if (value.includes("</") || value.includes("/>")) {
          return this.ssml;
        }
        return this.simple;
      });
    }

    if (text.includes("</") || text.includes("/>")) {
      return this.ssml;
    }
    return this.simple;
  }
}
