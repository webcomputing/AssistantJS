import { Constructor, Mixin } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add SuggestionChips-Feature
 */
export function SuggestionChipsMixin<MergedAnswerTypes extends BasicAnswerTypes, MergedHandlerConstructor extends Constructor<BasicHandler<MergedAnswerTypes>>>(
  superHandler: MergedHandlerConstructor
): Mixin<OptionalHandlerFeatures.SuggestionChips<MergedAnswerTypes>> & MergedHandlerConstructor {
  abstract class SuggestionChipsHandler extends superHandler implements OptionalHandlerFeatures.SuggestionChips<MergedAnswerTypes> {
    constructor(...args: any[]) {
      super(...args);
    }

    public setSuggestionChips(suggestionChips: MergedAnswerTypes["suggestionChips"] | Promise<MergedAnswerTypes["suggestionChips"]>): this {
      this.failIfInactive();

      this.promises.suggestionChips = { resolver: suggestionChips };
      return this;
    }

    protected abstract getBody(results: Partial<MergedAnswerTypes>): any;
  }

  return SuggestionChipsHandler;
}
