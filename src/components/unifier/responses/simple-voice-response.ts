import { Logger } from "../../root/public-interfaces";
import { ConditionalTypeA, ConditionalTypeB, MinimalResponseHandler, OptionalHandlerFeatures, Voiceable } from "../public-interfaces";
import { BaseResponse } from "./base-response";

export class SimpleVoiceResponse extends BaseResponse implements Voiceable {
  /** Response handler of the currently used platform */
  protected handler!: MinimalResponseHandler & OptionalHandlerFeatures.Reprompt;

  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean, logger: Logger) {
    super(handler, failSilentlyOnUnsupportedFeatures, logger);
  }

  public endSessionWith(text: Promise<string>): Promise<void>;
  public endSessionWith(text: string): void;
  public endSessionWith(text: string | Promise<string>): void | Promise<void> {
    if (this.isPromise(text)) {
      return text.then(value => {
        this.endSessionWith(value);
      });
    }

    this.handler.endSession = true;
    this.handler.voiceMessage = this.prepareText(text);
    return this.handler.sendResponse();
  }

  public prompt<T extends string | Promise<string>, S extends string | Promise<string>>(inputText: T, ...inputReprompts: S[]): ConditionalTypeB<T, S> {
    const withResolvedPromises = (text: string, reprompts: string[]) => {
      this.handler.endSession = false;
      this.handler.voiceMessage = this.prepareText(text);
      this.attachRepromptsIfAny(reprompts);
      return this.handler.sendResponse();
    };

    if (typeof inputText !== "string" || inputReprompts.some(r => typeof r !== "string")) {
      const allRepromptPromises = inputReprompts.map(r => Promise.resolve(r));
      return Promise.all([Promise.resolve(inputText) as Promise<string>, Promise.all(allRepromptPromises)]).then(a =>
        withResolvedPromises(a[0], a[1] as string[])
      ) as ConditionalTypeB<T, S>;
    }
    return withResolvedPromises(inputText, inputReprompts as string[]) as ConditionalTypeB<T, S>;
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

  /** typeguard to check if given value is string or Promise<string> */
  private isPromise(text: string | Promise<string>): text is Promise<string> {
    return typeof text !== "string";
  }
}
