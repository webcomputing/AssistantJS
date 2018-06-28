import { inject, injectable } from "inversify";
import { featureIsAvailable } from "../../../components/unifier/feature-checker";
import { injectionNames } from "../../../injection-names";
import {
  BeforeResponseHandler,
  MinimalRequestExtraction,
  MinimalResponseHandler,
  OptionalExtractions,
  OptionalHandlerFeatures,
} from "../../unifier/public-interfaces";

/**
 * Bind's itself to BeforeResponseHandler componentInterface and mirrors the sessionData from
 * extraction to handler, if nothing was changed.
 * This way, the session remains intact, even if we don't change any data.
 */

@injectable()
export class PlatformSessionMirror implements BeforeResponseHandler {
  constructor(@inject(injectionNames.current.extraction) private extraction: MinimalRequestExtraction) {}

  /**
   * Mirrors the sessionData from extraction to handler, if nothing was changed.
   * This way, the session remains intact, even if we don't change any data.
   */
  public execute(responseHandler: MinimalResponseHandler) {
    if (
      featureIsAvailable<OptionalExtractions.SessionData>(this.extraction, OptionalExtractions.FeatureChecker.SessionData) &&
      typeof this.extraction.sessionData === "string"
    ) {
      if (featureIsAvailable<OptionalHandlerFeatures.SessionData>(responseHandler, OptionalHandlerFeatures.FeatureChecker.SessionData)) {
        if (responseHandler.sessionData === null) {
          responseHandler.sessionData = this.extraction.sessionData;
        }
      } else {
        throw new Error(
          "You are trying to use the platform's session handling, but the platform's response handler does not support session handling. In consequence, you can't remain in sessions. Please consider using redis as session storage."
        );
      }
    }
  }
}
