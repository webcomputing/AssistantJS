import { Constructor, Mixin } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add SuggestionChips-Feature
 */
export function SuggestionChipsMixin<CustomTypes extends BasicAnswerTypes, CustomHandlerConstructor extends Constructor<BasicHandler<CustomTypes>>>(
  superHandler: CustomHandlerConstructor
): Mixin<OptionalHandlerFeatures.SuggestionChips<CustomTypes>> & CustomHandlerConstructor {
  abstract class SuggestionChipsHandler extends superHandler implements OptionalHandlerFeatures.SuggestionChips<CustomTypes> {
    constructor(...args: any[]) {
      super(...args);
    }

    public setSuggestionChips(suggestionChips: CustomTypes["suggestionChips"] | Promise<CustomTypes["suggestionChips"]>): this {
      this.promises.suggestionChips = { resolver: suggestionChips };
      return this;
    }

    protected abstract getBody(results: Partial<CustomTypes>);
  }

  return SuggestionChipsHandler;
}
