import { Logger } from "../../root/public-interfaces";
import { MinimalResponseHandler, OptionalHandlerFeatures, Voiceable } from "../public-interfaces";
import { BaseResponse } from "./base-response";

export class SimpleVoiceResponse extends BaseResponse implements Voiceable {
  /** Response handler of the currently used platform */
  protected handler!: MinimalResponseHandler & OptionalHandlerFeatures.Reprompt;

  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean, logger: Logger) {
    super(handler, failSilentlyOnUnsupportedFeatures, logger);
  }

  public endSessionWith(text: string): Promise<void> | void {
    this.handler.endSession = true;
    this.handler.voiceMessage = this.prepareText(text);
    this.handler.sendResponse();
  }

  public prompt(text: string | Promise<string>, ...reprompts: Array<string | Promise<string>>): Promise<void> | void {
    this.handler.endSession = false;
    let promiseA: Promise<any> | undefined;
    let promiseB: Promise<any> | undefined;
    const repromptPromises: [number[], Array<Promise<string>>] = [[], []];
    const repromptStrings: [number[], string[]] = [[], []];

    reprompts.forEach((reprompt, index) => {
      if (typeof reprompt === "string") {
        repromptStrings[0].push(index);
        repromptStrings[1].push(reprompt);
      } else {
        repromptPromises[0].push(index);
        repromptPromises[1].push(reprompt);
      }
    });

    if (typeof text === "string") {
      this.handler.voiceMessage = this.prepareText(text);
    } else {
      promiseA = text.then(value => {
        this.handler.voiceMessage = this.prepareText(value);
      });
    }

    if (repromptPromises[0].length === 0) {
      this.attachRepromptsIfAny(reprompts as string[]);
      this.handler.sendResponse();
      return;
    }
    promiseB = Promise.all(repromptPromises[1]).then((resolvedPromises: string[]) => {
      const unifiedReprompts: string[] = [];

      for (let i = 0; i < reprompts.length; i++) {
        const element = repromptStrings.find(value => {
          return value[0] === i;
        });

        if (typeof element !== "undefined") {
          unifiedReprompts.push(repromptStrings[1][i]);
        } else {
          unifiedReprompts.push(resolvedPromises[i]);
        }
      }
      this.attachRepromptsIfAny(unifiedReprompts as string[]);
    });

    if (!promiseA && !promiseB) {
      this.handler.sendResponse();
    } else {
      if (promiseA && !promiseB) {
        promiseA.then(() => {
          this.handler.sendResponse();
        });
      } else {
        if (!promiseA && promiseB) {
          promiseB.then(() => {
            this.handler.sendResponse();
          });
        } else {
          Promise.all([promiseA, promiseB]).then(() => {
            this.handler.sendResponse();
          });
        }
      }
    }
    return;
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
