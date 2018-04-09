import { MinimalResponseHandler, Voiceable } from "../public-interfaces";
import { BaseResponse } from "./base-response";

export class VoiceResponse implements Voiceable {
  private simple: Voiceable;
  private ssml: Voiceable;

  constructor(simple: Voiceable, ssml: Voiceable) {
    this.simple = simple;
    this.ssml = ssml;
  }

  endSessionWith(text: string) {
    if(typeof text === "string") {
      return (this.delegatorBasedOnInput(text) as Voiceable).endSessionWith(text);
    }
    return (this.delegatorBasedOnInput(text) as Promise<Voiceable>).then((voiceable) => {
      return voiceable.endSessionWith(text);
    });
  }

  prompt(text: string | Promise<string>, ...reprompts: Array<string | Promise<string>>) {
    if (typeof text === "string") {
      return (this.delegatorBasedOnInput(text) as Voiceable).prompt(text, ...reprompts);
    }
    return (this.delegatorBasedOnInput(text) as Promise<Voiceable>).then(voiceable => {
      return voiceable.prompt(text, ...reprompts);
    });
  }

  private delegatorBasedOnInput(text: string | Promise<string>) {
    if (typeof text === "undefined" || text === null) text = "";

    if (typeof text !== "string") {
      return text.then(value => {
        if (value.includes("</") || value.includes("/>")) {
          return this.ssml;
        } else {
          return this.simple;
        }
      });
    }

    if (text.includes("</") || text.includes("/>")) {
      return this.ssml;
    } else {
      return this.simple;
    }
  }
}
