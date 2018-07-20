import { Constructor, MinimalRequestExtraction, Mixin, RequestContext } from "../../../../assistant-source";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes, BasicHandable, ChatBubblesHandable, ResponseHandlerExtensions, SessionHandable } from "../handler-types";

export function ChatBubblesMixin<CustomTypes extends BasicAnswerTypes, CustomHandlerConstructor extends Constructor<BasicHandler<CustomTypes>>>(
  superHandler: CustomHandlerConstructor
): Mixin<ChatBubblesHandable<CustomTypes>> & CustomHandlerConstructor {
  abstract class ChatBubblesHandler extends superHandler implements ChatBubblesHandable<CustomTypes> {
    constructor(...args: any[]) {
      super(...args);
    }

    public setChatBubbles(chatBubbles: CustomTypes["chatBubbles"] | Promise<CustomTypes["chatBubbles"]>): this {
      this.promises.chatBubbles = { resolver: chatBubbles };
      return this;
    }

    protected abstract getBody(results: Partial<CustomTypes>);
  }

  return ChatBubblesHandler;
}
