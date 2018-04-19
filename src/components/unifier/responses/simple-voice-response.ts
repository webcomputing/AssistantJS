import { Logger } from "../../root/public-interfaces";
import { ConditionalType, MinimalResponseHandler, OptionalHandlerFeatures, Voiceable } from "../public-interfaces";
import { BaseResponse } from "./base-response";

export class SimpleVoiceResponse extends BaseResponse implements Voiceable {
  /** Response handler of the currently used platform */
  protected handler!: MinimalResponseHandler & OptionalHandlerFeatures.Reprompt;

  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean, logger: Logger) {
    super(handler, failSilentlyOnUnsupportedFeatures, logger);
  }

  public endSessionWith<T extends string | Promise<string>>(text: T): ConditionalType<T> {
    if (typeof text !== "string") {
      (text as Promise<string>).then(value => {
        this.handler.endSession = true;
        this.handler.voiceMessage = this.prepareText(value);
        this.handler.sendResponse();
        return;
      });
    }

    this.handler.endSession = true;
    this.handler.voiceMessage = this.prepareText(text as string);
    this.handler.sendResponse();
    return undefined as any;
  }

  public prompt<T extends string | Promise<string>>(inputText: T, ...inputReprompts: Array<string | Promise<string>>): ConditionalType<T> {
    const withResolvedPromises = (text: string, reprompts: string[]) => {
      this.handler.endSession = false;
      this.handler.voiceMessage = this.prepareText(text);
      this.attachRepromptsIfAny(reprompts);
      this.handler.sendResponse();
      return;
    };

    if (typeof inputText !== "string" || inputReprompts.some(r => typeof r !== "string")) {
      const allRepromptPromises = inputReprompts.map(r => Promise.resolve(r));
      return Promise.all([Promise.resolve(inputText) as Promise<string>, Promise.all(allRepromptPromises)]).then(a =>
        withResolvedPromises(a[0], a[1])
      ) as ConditionalType<T>;
    }
    return withResolvedPromises(inputText, inputReprompts as string[]) as ConditionalType<T>;
  }

  /** Attaches reprompts to handler */
  protected attachRepromptsIfAny(reprompts: string[] = []) {
    if (reprompts.length > 0) {
      this.reportIfUnavailable(OptionalHandlerFeatures.FeatureChecker.Reprompt, "The currently used platform does not support reprompting.");
      this.handler.reprompts = reprompts.map(reprompt => this.prepareText(reprompt));
    }
  }

  /** Easy overwrite functionality for text preprocessing */
  protected prepareText(text: string) {
    return text;
  }

  /** checks if an object has any own properties */
  private isEmpty(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) return false;
    }
    return true;
  }
}
