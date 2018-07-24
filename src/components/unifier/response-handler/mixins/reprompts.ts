import { Constructor, Mixin } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add Reprompts-Feature
 */
export function RepromptsMixin<CustomTypes extends BasicAnswerTypes, CustomHandlerConstructor extends Constructor<BasicHandler<CustomTypes>>>(
  superHandler: CustomHandlerConstructor
): Mixin<OptionalHandlerFeatures.Reprompts<CustomTypes>> & CustomHandlerConstructor {
  abstract class RepromptsHandler extends superHandler implements OptionalHandlerFeatures.Reprompts<CustomTypes> {
    constructor(...args: any[]) {
      super(...args);
    }

    public prompt(
      inputText: CustomTypes["voiceMessage"]["text"] | Promise<CustomTypes["voiceMessage"]["text"]>,
      ...reprompts: Array<CustomTypes["voiceMessage"]["text"] | Promise<CustomTypes["voiceMessage"]["text"]>>
    ): this {
      this.failIfInactive();

      // add reprompts with remapper function
      if (reprompts && reprompts.length > 0) {
        this.promises.reprompts = this.getRepromptArrayRemapper(reprompts);
      }

      return super.prompt(inputText);
    }

    public setReprompts(
      reprompts: Array<CustomTypes["voiceMessage"]["text"] | Promise<CustomTypes["voiceMessage"]["text"]>> | Promise<Array<CustomTypes["voiceMessage"]["text"]>>
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

    protected abstract getBody(results: Partial<CustomTypes>): any;

    /**
     * Builds the Remapper for Reprompts in an Array of promises and strings
     * @param reprompts
     */
    private getRepromptArrayRemapper(
      reprompts: Array<CustomTypes["voiceMessage"]["text"] | Promise<CustomTypes["voiceMessage"]["text"]>>
    ): {
      resolver: Promise<Array<CustomTypes["voiceMessage"]["text"]>>;
      thenMap: (finaleReprompts: Array<CustomTypes["voiceMessage"]["text"]>) => CustomTypes["reprompts"];
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
    private createRepromptAnswerArray(reprompts: string[]) {
      return reprompts.map(this.createPromptAnswer);
    }
  }

  return RepromptsHandler;
}
