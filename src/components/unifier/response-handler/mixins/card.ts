import { Constructor, MinimalRequestExtraction, Mixin, RequestContext } from "../../../../assistant-source";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes, BasicHandable, CardHandable, ResponseHandlerExtensions, SessionHandable } from "../handler-types";

export function CardMixin<CustomTypes extends BasicAnswerTypes, CustomHandlerConstructor extends Constructor<BasicHandler<CustomTypes>>>(
  superHandler: CustomHandlerConstructor
): Mixin<CardHandable<CustomTypes>> & CustomHandlerConstructor {
  abstract class CardHandler extends superHandler implements CardHandable<CustomTypes> {
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
