import { Constructor, Mixin } from "../../../../assistant-source";
import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add ChatBubbles-Feature
 */
export function ChatBubblesMixin<MergedAnswerTypes extends BasicAnswerTypes, MergedHandlerConstructor extends Constructor<BasicHandler<MergedAnswerTypes>>>(
  superHandler: MergedHandlerConstructor
): Mixin<OptionalHandlerFeatures.ChatBubbles<MergedAnswerTypes>> & MergedHandlerConstructor {
  abstract class ChatBubblesHandler extends superHandler implements OptionalHandlerFeatures.ChatBubbles<MergedAnswerTypes> {
    constructor(...args: any[]) {
      super(...args);
    }

    public setChatBubbles(chatBubbles: MergedAnswerTypes["chatBubbles"] | Promise<MergedAnswerTypes["chatBubbles"]>): this {
      this.failIfInactive();

      this.promises.chatBubbles = { resolver: chatBubbles };
      return this;
    }

    protected abstract getBody(results: Partial<MergedAnswerTypes>): any;
  }

  return ChatBubblesHandler;
}
