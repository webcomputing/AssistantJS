import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add SuggestionChips-Feature
 */
export class SuggestionChipsMixin<MergedAnswerTypes extends BasicAnswerTypes> extends BasicHandler<MergedAnswerTypes>
  implements OptionalHandlerFeatures.SuggestionChips<MergedAnswerTypes> {
  public setSuggestionChips(suggestionChips: MergedAnswerTypes["suggestionChips"] | Promise<MergedAnswerTypes["suggestionChips"]>): this {
    this.failIfInactive();

    this.promises.suggestionChips = { resolver: suggestionChips };
    return this;
  }
}
