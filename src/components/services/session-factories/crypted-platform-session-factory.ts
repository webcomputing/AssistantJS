import { inject, injectable } from "inversify";
import { Component } from "inversify-components";
import { injectionNames } from "../../../injection-names";
import { MinimalRequestExtraction, MinimalResponseHandler, OptionalExtractions, OptionalHandlerFeatures } from "../../unifier/public-interfaces";
import { Configuration, SessionConfiguration } from "../private-interfaces";
import { Session } from "../public-interfaces";
import { CryptedPlatformSession } from "./crypted-platform-session";
import { PlatformSessionFactory } from "./platform-session-factory";

/** Works the same as PlatformSessionFactory, but may also pass the configured encryption key */

@injectable()
export class CryptedPlatformSessionFactory extends PlatformSessionFactory {
  constructor(
    @inject(injectionNames.current.extraction) extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.responseHandler) handler: MinimalResponseHandler
  ) {
    super(extraction, handler);
  }

  protected createSession(
    extraction: OptionalExtractions.SessionData,
    handler: OptionalHandlerFeatures.SessionData,
    configuration?: SessionConfiguration.CryptedPlatform
  ): Session {
    return new CryptedPlatformSession(extraction, handler, configuration ? configuration.encryptionKey : undefined);
  }
}
