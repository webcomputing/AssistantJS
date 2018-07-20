import { Constructor, Mixin } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add Card-Feature
 */
export function CardMixin<CustomTypes extends BasicAnswerTypes, CustomHandlerConstructor extends Constructor<BasicHandler<CustomTypes>>>(
  superHandler: CustomHandlerConstructor
): Mixin<OptionalHandlerFeatures.Card<CustomTypes>> & CustomHandlerConstructor {
  abstract class CardHandler extends superHandler implements OptionalHandlerFeatures.Card<CustomTypes> {
    constructor(...args: any[]) {
      super(...args);
    }

    public setCard(card: CustomTypes["card"] | Promise<CustomTypes["card"]>): this {
      this.promises.card = { resolver: card };
      return this;
    }

    protected abstract getBody(results: Partial<CustomTypes>);
  }

  return CardHandler;
}
