import { Logger } from "../../root/public-interfaces";
import { MinimalResponseHandler, OptionalHandlerFeatures } from "../public-interfaces";
import { BaseResponse } from "./base-response";

export class ChatResponse extends BaseResponse {
  /** Response handler of the currently used platform */
  protected handler: OptionalHandlerFeatures.GUI.ChatBubble & MinimalResponseHandler;

  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean, logger: Logger) {
    super(handler, failSilentlyOnUnsupportedFeatures, logger);

    this.reportIfUnavailable(OptionalHandlerFeatures.FeatureChecker.ChatBubble, "The currently used platform does not support chat messages.");
  }

  /**
   * Adds a chat bubble to response
   * @param {string} bubbleText Adds another chat bubble to response
   * @return {ChatResponse} This response object for method chaining
   */
  public addChatBubble(bubbleText: string) {
    // Initialize chatBubbles array
    if (typeof this.handler.chatBubbles === "undefined" || this.handler.chatBubbles === null) this.handler.chatBubbles = [];

    // Add new bubble
    this.handler.chatBubbles.push(bubbleText);

    return this;
  }
}
