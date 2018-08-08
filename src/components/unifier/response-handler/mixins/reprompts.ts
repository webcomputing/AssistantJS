import { Constructor, Mixin } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add Reprompts-Feature
 */
export class RepromptsMixin<MergedAnswerTypes extends BasicAnswerTypes> extends BasicHandler<MergedAnswerTypes>
  implements OptionalHandlerFeatures.Reprompts<MergedAnswerTypes> {
  public prompt(
    inputText: MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>,
    ...reprompts: Array<MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>>
  ): this {
    this.failIfInactive();

    // add reprompts with remapper function
    if (reprompts && reprompts.length > 0) {
      this.promises.reprompts = this.getRepromptArrayRemapper(reprompts);
    }

    return super.prompt(inputText);
  }

  public setReprompts(
    reprompts:
      | Array<MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>>
      | Promise<Array<MergedAnswerTypes["voiceMessage"]["text"]>>
  ): this {
    this.failIfInactive();

    // check wether it is an Arry or an Promise
    if (Array.isArray(reprompts)) {
      // add reprompts as Array with remapper function
      this.promises.reprompts = this.getRepromptArrayRemapper(reprompts);
    } else {
      // Add Promise and thenMap function
      this.promises.reprompts = {
        resolver: reprompts,
        thenMap: this.createRepromptAnswerArray,
      };
    }

    return this;
  }

  /**
   * Builds the Remapper for Reprompts in an Array of promises and strings
   * this method must be publix, so that it can be applied to another class with Mixins
   * @param reprompts
   */
  public getRepromptArrayRemapper(
    reprompts: Array<MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>>
  ): {
    resolver: Promise<Array<MergedAnswerTypes["voiceMessage"]["text"]>>;
    thenMap: (finaleReprompts: Array<MergedAnswerTypes["voiceMessage"]["text"]>) => MergedAnswerTypes["reprompts"];
  } {
    return {
      resolver: Promise.all(reprompts),
      thenMap: this.createRepromptAnswerArray,
    };
  }

  /**
   * Builds ther Remappee from an string Array
   * @param reprompts
   */
  public createRepromptAnswerArray(reprompts: string[]) {
    return reprompts.map(this.createPromptAnswer);
  }
}
