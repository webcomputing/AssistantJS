import { inject, injectable } from "inversify";
import { Constructor } from "../../../assistant-source";
import { injectionNames } from "../../../injection-names";
import { featureIsAvailable } from "../../unifier/feature-checker";
import { BasicHandable, MinimalRequestExtraction, OptionalExtractions } from "../../unifier/public-interfaces";
import { BasicHandler } from "../../unifier/response-handler";
import { CurrentSessionFactory, Session, SessionFactory } from "../public-interfaces";
import { PlatformSession } from "./platform-session";

/** Gets current platform-based session by current request handler & extraction. Needs SessionData feature support by request handler. */

@injectable()
export class PlatformSessionFactory implements SessionFactory {
  constructor(
    @inject(injectionNames.current.extraction) private extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.responseHandler) private handler: BasicHandler<any>
  ) {}

  /** Gets current platform-based session by current request handler & extraction. Needs SessionData feature support by request handler. */
  public getCurrentSession(configurationAttributes?: any): Session {
    if (featureIsAvailable<OptionalExtractions.SessionData>(this.extraction, OptionalExtractions.FeatureChecker.SessionData)) {
      return this.createSession(this.extraction, this.handler, configurationAttributes);
    }

    throw new Error(
      `The currently used platform (${
        this.extraction.platform
      }) does not support session data in it's extraction. You might want to switch to a redis-based session storage.`
    );
  }

  /** Creates the object */
  protected createSession(extraction: OptionalExtractions.SessionData, handler: BasicHandler<any>, configurationAttributes?: any): Session {
    return new PlatformSession(extraction, handler);
  }
}
