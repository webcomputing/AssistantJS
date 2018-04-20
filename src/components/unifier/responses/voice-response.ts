import { ConditionalTypeA, ConditionalTypeB, MinimalResponseHandler, Voiceable } from "../public-interfaces";
import { BaseResponse } from "./base-response";

export class VoiceResponse implements Voiceable {
  private simple: Voiceable;
  private ssml: Voiceable;

  constructor(simple: Voiceable, ssml: Voiceable) {
    this.simple = simple;
    this.ssml = ssml;
  }

  public endSessionWith<T extends string | Promise<string>>(text: T): ConditionalTypeA<T> {
    if (typeof text === "string") {
      return this.delegatorBasedOnInput(text as string).endSessionWith(text as string) as ConditionalTypeA<T>;
    }
    return (text as Promise<string>).then(evText => this.delegatorBasedOnInput(evText as string).endSessionWith(evText as string)) as ConditionalTypeA<T>;
  }

  public prompt<T extends string | Promise<string>, X extends string | Promise<string>>(text: T, ...reprompts: X[]): ConditionalTypeB<T, X> {
    if (typeof text !== "string" || reprompts.some(r => typeof r !== "string")) {
      const repromptPromises = reprompts.map(r => Promise.resolve(r));
      return (Promise.all([Promise.resolve(text), Promise.all(repromptPromises)]).then(a =>
        this.delegatorBasedOnInput(a[0] as string).prompt(a[0], ...(a[1] as string[]))
      ) as Promise<void>) as ConditionalTypeB<T, X>;
    }

    return this.delegatorBasedOnInput(text as string).prompt(text as string, ...(reprompts as string[])) as ConditionalTypeB<T, X>;
  }

  private delegatorBasedOnInput(text: string) {
    if (text.includes("</") || text.includes("/>")) {
      return this.ssml;
    }
    return this.simple;
  }
}
