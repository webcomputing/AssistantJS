import { Constructor, Mixin } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add Card-Feature
 */
export function CardMixin<MergedAnswerTypes extends BasicAnswerTypes, MergedHandlerConstructor extends Constructor<BasicHandler<MergedAnswerTypes>>>(
  superHandler: MergedHandlerConstructor
): Mixin<OptionalHandlerFeatures.Card<MergedAnswerTypes>> & MergedHandlerConstructor {
  abstract class CardHandler extends superHandler implements OptionalHandlerFeatures.Card<MergedAnswerTypes> {
    constructor(...args: any[]) {
      super(...args);
    }

    public setCard(card: MergedAnswerTypes["card"] | Promise<MergedAnswerTypes["card"]>): this {
      this.failIfInactive();

      this.promises.card = { resolver: card };
      return this;
    }

    protected abstract getBody(results: Partial<MergedAnswerTypes>): any;
  }

  return CardHandler;
}
