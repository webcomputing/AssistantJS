import { inject, injectable } from "inversify";
import { injectionNames } from "../../../injection-names";
import { featureIsAvailable } from "../../unifier/feature-checker";
import { MinimalRequestExtraction, OptionalExtractions, OptionalHandlerFeatures } from "../../unifier/public-interfaces";
import { BasicSessionHandable } from "../../unifier/response-handler";
import { Session, SessionFactory } from "../public-interfaces";
import { PlatformSession } from "./platform-session";

/** Gets current platform-based session by current request handler & extraction. Needs SessionData feature support by request handler. */

@injectable()
export class PlatformSessionFactory implements SessionFactory {
  constructor(
    @inject(injectionNames.current.extraction) private extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.responseHandler) private handler: BasicSessionHandable<any>
  ) {}

  /** Gets current platform-based session by current request handler & extraction. Needs SessionData feature support by request handler. */
  public getCurrentSession(configurationAttributes?: any): Session {
    if (featureIsAvailable<OptionalExtractions.SessionData>(this.extraction, OptionalExtractions.FeatureChecker.SessionData)) {
      if (featureIsAvailable(this.handler, OptionalHandlerFeatures.SessionData)) {
        return this.createSession(this.extraction, this.handler, configurationAttributes);
      }

      throw new Error(
        `You are trying to use the platform's (${
          this.extraction.platform
        }) session handling, but the platform's response handler does not support session handling. In consequence, you can't remain in sessions. Please consider using redis as session storage.`
      );
    }

    throw new Error(
      `The currently used platform (${
        this.extraction.platform
      }) does not support session data in it's extraction. You might want to switch to a redis-based session storage.`
    );
  }

  /** Creates the object */
  protected createSession(extraction: OptionalExtractions.SessionData, handler: BasicSessionHandable<any>, configurationAttributes?: any): Session {
    return new PlatformSession(extraction, handler);
  }
}
