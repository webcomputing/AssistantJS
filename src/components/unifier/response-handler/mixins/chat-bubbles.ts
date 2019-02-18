import { OptionalHandlerFeatures } from "../../public-interfaces";
import { BasicHandler } from "../basic-handler";
import { BasicAnswerTypes } from "../handler-types";

/**
 * Mixin to add ChatBubbles-Feature
 */
export class ChatBubblesMixin<MergedAnswerTypes extends BasicAnswerTypes> extends BasicHandler<MergedAnswerTypes>
  implements OptionalHandlerFeatures.ChatBubbles<MergedAnswerTypes> {
  public setChatBubbles(chatBubbles: MergedAnswerTypes["chatBubbles"] | Promise<MergedAnswerTypes["chatBubbles"]>): this {
    this.failIfInactive();

    this.promises.chatBubbles = { resolver: chatBubbles };
    return this;
  }
}
