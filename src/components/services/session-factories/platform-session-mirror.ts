import { inject, injectable } from "inversify";
import { injectionNames } from "../../../injection-names";
import { featureIsAvailable } from "../../unifier/feature-checker";
import { BeforeResponseHandler, MinimalRequestExtraction, OptionalExtractions } from "../../unifier/public-interfaces";
import { BasicHandler } from "../../unifier/response-handler";

/**
 * Bind's itself to BeforeResponseHandler componentInterface and mirrors the sessionData from
 * extraction to handler, if nothing was changed.
 * This way, the session remains intact, even if we don't change any data.
 */

@injectable()
export class PlatformSessionMirror implements BeforeResponseHandler<any, any> {
  constructor(@inject(injectionNames.current.extraction) private extraction: MinimalRequestExtraction) {}

  /**
   * Mirrors the sessionData from extraction to handler, if nothing was changed.
   * This way, the session remains intact, even if we don't change any data.
   */
  public async execute(responseHandler: BasicHandler<any>) {
    if (
      featureIsAvailable<OptionalExtractions.SessionData>(this.extraction, OptionalExtractions.FeatureChecker.SessionData) &&
      typeof this.extraction.sessionData === "string"
    ) {
      const currentSessionData = await responseHandler.getSessionData();

      if (!currentSessionData) {
        responseHandler.setSessionData(this.extraction.sessionData);
      }
    }
  }
}
