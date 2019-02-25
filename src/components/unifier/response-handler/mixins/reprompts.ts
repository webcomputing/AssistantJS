import { Constructor, Mixin, OptionallyPromise } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add Reprompts-Feature
 */
export class RepromptsMixin<MergedAnswerTypes extends BasicAnswerTypes> extends BasicHandler<MergedAnswerTypes>
  implements OptionalHandlerFeatures.Reprompts<MergedAnswerTypes> {
  /**
   * implementation of prompt with reprompts
   */
  public prompt(
    inputText: OptionallyPromise<MergedAnswerTypes["voiceMessage"]["text"]>,
    ...reprompts: Array<OptionallyPromise<MergedAnswerTypes["voiceMessage"]["text"]>>
  ): this {
    // add reprompts with remapper function
    if (reprompts && reprompts.length > 0) {
      this.addRepromptsArray(reprompts);
    }

    return super.prompt(inputText);
  }

  public setReprompts(
    reprompts: Array<OptionallyPromise<MergedAnswerTypes["voiceMessage"]["text"]>> | Promise<Array<MergedAnswerTypes["voiceMessage"]["text"]>>
  ): this {
    // check wether it is an Arry or an Promise
    if (Array.isArray(reprompts)) {
      // add reprompts as Array with remapper function
      this.addRepromptsArray(reprompts);
    } else {
      // Add Promise and thenMap function
      this.setResolverAndReturnThis("reprompts", reprompts, this.createRepromptAnswerArray);
    }

    return this;
  }

  /**
   * Builds the Remapper for Reprompts in an Array of promises and strings
   * this method must be publix, so that it can be applied to another class with Mixins
   * @param reprompts
   */
  public getRepromptArrayRemapper(
    reprompts: Array<OptionallyPromise<MergedAnswerTypes["voiceMessage"]["text"]>>
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

  /** Adds array of reprompts using setResolverAndReturnThis */
  private addRepromptsArray(reprompts: Array<OptionallyPromise<MergedAnswerTypes["voiceMessage"]["text"]>>) {
    const repromptArrayMapper = this.getRepromptArrayRemapper(reprompts);
    this.setResolverAndReturnThis("reprompts", repromptArrayMapper.resolver, repromptArrayMapper.thenMap);
  }
}
