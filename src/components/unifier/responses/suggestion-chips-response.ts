import { Logger } from "../../root/public-interfaces";
import { MinimalResponseHandler, OptionalHandlerFeatures } from "../public-interfaces";
import { BaseResponse } from "./base-response";

export class SuggestionChipsResponse extends BaseResponse {
  /** Response handler of the currently used platform */
  protected handler!: OptionalHandlerFeatures.GUI.SuggestionChips & MinimalResponseHandler;

  constructor(handler: MinimalResponseHandler, failSilentlyOnUnsupportedFeatures: boolean, logger: Logger) {
    super(handler, failSilentlyOnUnsupportedFeatures, logger);

    this.reportIfUnavailable(OptionalHandlerFeatures.FeatureChecker.SuggestionChip, "The currently used platform does not support suggestion chips.");
  }

  /**
   * Adds a suggestion chip to response
   * @param {string} suggestionChip Text of suggestion chip
   * @return {SuggestionChipsResponse} This response object for method chaining
   */
  public addSuggestionChip(suggestionChip: string) {
    // Initialize suggestionChips array
    if (typeof this.handler.suggestionChips === "undefined" || this.handler.suggestionChips === null) this.handler.suggestionChips = [];

    // Add new suggestion chip
    this.handler.suggestionChips.push(suggestionChip);

    return this;
  }
}
