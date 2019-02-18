import { inject, injectable } from "inversify";
import { injectionNames } from "../../../injection-names";
import { featureIsAvailable } from "../../unifier/feature-checker";
import { BeforeResponseHandler, MinimalRequestExtraction, OptionalExtractions, OptionalHandlerFeatures } from "../../unifier/public-interfaces";
import { BasicSessionHandable } from "../../unifier/response-handler";

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
  public async execute(responseHandler: BasicSessionHandable<any>) {
    if (
      featureIsAvailable<OptionalExtractions.SessionData>(this.extraction, OptionalExtractions.FeatureChecker.SessionData) &&
      typeof this.extraction.sessionData === "string"
    ) {
      if (featureIsAvailable(responseHandler, OptionalHandlerFeatures.FeatureChecker.SessionData)) {
        const currentSessionData = await responseHandler.getSessionData();

        if (!currentSessionData) {
          responseHandler.setSessionData(this.extraction.sessionData);
        }
      } else {
        throw new Error(
          `You are trying to use the platform's (${
            this.extraction.platform
          }) session handling, but the platform's response handler does not support session handling. In consequence, you can't remain in sessions. Please consider using redis as session storage.`
        );
      }
    }
  }
}
