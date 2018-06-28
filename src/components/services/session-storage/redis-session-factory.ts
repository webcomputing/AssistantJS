import { inject, injectable } from "inversify";
import { injectionNames } from "../../../injection-names";
import { MinimalRequestExtraction } from "../../unifier/public-interfaces";
import { SessionConfiguration } from "../private-interfaces";
import { CurrentSessionFactory, Session } from "../public-interfaces";
import { RedisSession } from "./redis-session";

/** Gets current redis-based session by extracted session id */

@injectable()
export class RedisSessionFactory implements CurrentSessionFactory {
  constructor(@inject(injectionNames.current.extraction) private extraction: MinimalRequestExtraction) {}

  /** Gets current session by extracted session id */
  public getCurrentSession(configurationAttributes: SessionConfiguration.Redis): Session {
    return new RedisSession(this.extraction.sessionID, configurationAttributes.redisClient, configurationAttributes.maxLifeTime);
  }
}
