import { Constructor, Mixin } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add ChatBubbles-Feature
 */
export function ChatBubblesMixin<CustomTypes extends BasicAnswerTypes, CustomHandlerConstructor extends Constructor<BasicHandler<CustomTypes>>>(
  superHandler: CustomHandlerConstructor
): Mixin<OptionalHandlerFeatures.ChatBubbles<CustomTypes>> & CustomHandlerConstructor {
  abstract class ChatBubblesHandler extends superHandler implements OptionalHandlerFeatures.ChatBubbles<CustomTypes> {
    constructor(...args: any[]) {
      super(...args);
    }

    public setChatBubbles(chatBubbles: CustomTypes["chatBubbles"] | Promise<CustomTypes["chatBubbles"]>): this {
      this.promises.chatBubbles = { resolver: chatBubbles };
      return this;
    }

    protected abstract getBody(results: Partial<CustomTypes>): any;
  }

  return ChatBubblesHandler;
}
