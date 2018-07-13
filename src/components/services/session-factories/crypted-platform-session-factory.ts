import { inject, injectable } from "inversify";
import { injectionNames } from "../../../injection-names";
import { MinimalRequestExtraction, OptionalExtractions } from "../../unifier/public-interfaces";
import { BasicHandler } from "../../unifier/response-handler";
import { SessionConfiguration } from "../private-interfaces";
import { Session } from "../public-interfaces";
import { CryptedPlatformSession } from "./crypted-platform-session";
import { PlatformSessionFactory } from "./platform-session-factory";

/** Works the same as PlatformSessionFactory, but may also pass the configured encryption key */

@injectable()
export class CryptedPlatformSessionFactory extends PlatformSessionFactory {
  constructor(
    @inject(injectionNames.current.extraction) extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.responseHandler) handler: BasicHandler<any>
  ) {
    super(extraction, handler);
  }

  protected createSession(
    extraction: OptionalExtractions.SessionData,
    handler: BasicHandler<any>,
    configuration?: SessionConfiguration.CryptedPlatform
  ): Session {
    return new CryptedPlatformSession(extraction, handler, configuration ? configuration.encryptionKey : undefined);
  }
}
