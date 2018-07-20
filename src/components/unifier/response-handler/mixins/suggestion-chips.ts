import { Constructor, MinimalRequestExtraction, Mixin, RequestContext } from "../../../../assistant-source";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes, BasicHandable, ResponseHandlerExtensions, SessionHandable, SuggestionChipsHandable } from "../handler-types";

export function SuggestionChipsMixin<CustomTypes extends BasicAnswerTypes, CustomHandlerConstructor extends Constructor<BasicHandler<CustomTypes>>>(
  superHandler: CustomHandlerConstructor
): Mixin<SuggestionChipsHandable<CustomTypes>> & CustomHandlerConstructor {
  abstract class SuggestionChipsHandler extends superHandler implements SuggestionChipsHandable<CustomTypes> {
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
