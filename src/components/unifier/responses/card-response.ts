import { MinimalResponseHandler, OptionalHandlerFeatures } from "../interfaces";
import { BaseResponse } from "./base-response";

export class CardResponse extends BaseResponse {
  handler: OptionalHandlerFeatures.Display.SimpleCardDisplay & OptionalHandlerFeatures.Display.ImageCardDisplay & MinimalResponseHandler;

  constructor(handler: MinimalResponseHandler) {
    super(handler);
    
    if (!this.featureIsAvailable(OptionalHandlerFeatures.FeatureChecker.SimpleCardDisplay))
      throw new Error("Displaying a simple card with title and text is not available for this response handler: " + this.handler);
  }

  /** Sets the card's title
   * @param title title to display
   * @return Returns card response itself, enabling method chaining
   */
  setTitle(title: string) {
    this.handler.cardTitle = title;
  }

  /** Sets the card's body
   * @param title title to display
   * @return Returns card response itself, enabling method chaining
   */
  setBody(body: string) {
    this.handler.displayText = body;
  }

  /** Sets the card's image. Throws exception if current handler is not able to display images.
   * @param image link of image to display
   * @return Returns card response itself, enabling method chaining
   */
  setImage(imageURL: string) {
    if (!this.featureIsAvailable(OptionalHandlerFeatures.FeatureChecker.ImageCardDisplay))
      throw new Error("Displaying an image card is not available for this response handler: " + this.handler);
    
    this.handler.displayImage = imageURL;
  }
}