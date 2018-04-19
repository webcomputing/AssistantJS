import { ConditionalType, MinimalResponseHandler, Voiceable } from "../public-interfaces";
import { BaseResponse } from "./base-response";

export class VoiceResponse implements Voiceable {
  private simple: Voiceable;
  private ssml: Voiceable;

  constructor(simple: Voiceable, ssml: Voiceable) {
    this.simple = simple;
    this.ssml = ssml;
  }

  public endSessionWith<T extends string | Promise<string>>(text: T): ConditionalType<T> {
    if (typeof text === "string") {
      return this.delegatorBasedOnInput(text as string).endSessionWith(text as string) as ConditionalType<T>;
    }
    return (text as Promise<string>).then(evText => this.delegatorBasedOnInput(evText as string).endSessionWith(evText as string)) as ConditionalType<T>;
  }

  public prompt<T extends string | Promise<string>>(text: T, ...reprompts: Array<string | Promise<string>>): ConditionalType<T> {
    if (typeof text === "string") {
      return this.delegatorBasedOnInput(text as string).prompt(text as string, ...reprompts) as ConditionalType<T>;
    }

    return (text as Promise<string>).then(evText => this.delegatorBasedOnInput(evText as string).prompt(evText as string, ...reprompts)) as ConditionalType<T>;
  }

  private delegatorBasedOnInput(text: string) {
    if (text.includes("</") || text.includes("/>")) {
      return this.ssml;
    }
    return this.simple;
  }
}
