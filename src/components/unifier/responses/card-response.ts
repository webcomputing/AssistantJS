import { MinimalResponseHandler, OptionalHandlerFeatures } from "../interfaces";
import { BaseResponse } from "./base-response";

export class CardResponse extends BaseResponse {
  /** Response handler of the currently used platform */
  protected handler: OptionalHandlerFeatures.GUI.Card.Simple & OptionalHandlerFeatures.GUI.Card.Image & MinimalResponseHandler;

  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean) {
    super(handler, failSilentlyOnUnsupportedFeatures);
    
    this.reportIfUnavailable(OptionalHandlerFeatures.FeatureChecker.SimpleCard, "The currently selected platform does not support sending cards.");
  }

  /** Sets the card's title
   * @param {string} title title to display
   * @return Returns card response itself, enabling method chaining
   */
  setTitle(title: string) {
    this.handler.cardTitle = title;
    return this;
  }

  /** Sets the card's body
   * @param {string} title title to display
   * @return Returns card response itself, enabling method chaining
   */
  setBody(body: string) {
    this.handler.cardBody = body;
    return this;
  }

  /** Sets the card's image. Throws exception if current handler is not able to display images.
   * @param {string} image link of image to display
   * @return Returns card response itself, enabling method chaining
   */
  setImage(imageURL: string) {
    this.reportIfUnavailable(OptionalHandlerFeatures.FeatureChecker.ImageCard, "The currently selected platform does not support using images in cards.");
    
    this.handler.cardImage = imageURL;
    
    return this;
  }
}