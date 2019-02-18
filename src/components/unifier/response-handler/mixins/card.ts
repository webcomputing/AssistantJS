import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add Card-Feature
 */
export abstract class CardMixin<MergedAnswerTypes extends BasicAnswerTypes> extends BasicHandler<MergedAnswerTypes>
  implements OptionalHandlerFeatures.Card<MergedAnswerTypes> {
  public setCard(card: MergedAnswerTypes["card"] | Promise<MergedAnswerTypes["card"]>): this {
    this.failIfInactive();

    this.promises.card = { resolver: card };
    return this;
  }
}
