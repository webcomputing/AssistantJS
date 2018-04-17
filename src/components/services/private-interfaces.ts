import { RedisClient } from "redis";

export namespace Configuration {
  /** Configuration defaults -> all of these keys are optional for user */
  export interface Defaults {
    /**
     * Maximum life time of a session in seconds. Useful if sessions are not getting fully closed by error.
     * Defaults to 1800. Counter starts after each successful SET command.
     */
    maxLifeTime: number;
  }

  /** Required configuration options, no defaults are used here */
  export interface Required {
    /** Client object to access redis instance */
    redisClient: RedisClient;
  }

  /** Available configuration settings in a runtime application */
  export interface Runtime extends Defaults, Required {}
}
