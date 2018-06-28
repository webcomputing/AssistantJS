import { RedisClient } from "redis";

export const componentInterfaces = {
  currentSessionFactory: Symbol("current-session-factory"),
};

/** All session storage configuration */
export namespace SessionConfiguration {
  /** Use this configuration if you want to use redis as session storage */
  export interface Redis {
    /**
     * Maximum life time of a session in seconds. Useful if sessions are not getting fully closed by error.
     * Use something like 1800. Counter starts after each successful SET command.
     */
    maxLifeTime: number;

    /** Client object to access redis instance */
    redisClient: RedisClient;
  }
}

export namespace Configuration {
  /** Configuration defaults -> all of these keys are optional for user */
  export interface Defaults {
    /**
     * Configure your desired session storage by naming the name of the factory to use.
     * AssistantJS admits that in the dependency injection container exists a factory class implementing CurrentSessionFactory, bound to
     * componentInterfaces.currentSessionFactory and named as you provided here.
     * AssistantJS defines two session factorys on it's own:
     * - "redis" gives you a redis-based session storage, which is usable for all platforms.
     * - "platform" uses the platform extraction and handler to store session data - this might not be available on all platforms
     * In addition, you can use "custom" and bind a factory on your own to componentInterfaces.currentSessionFactory named "custom" to handle
     * everything on your own.
     */
    sessionStorage: { factoryName: "redis"; configuration: SessionConfiguration.Redis } | { factoryName: "platform" } | { factoryName: "custom" };
  }

  /** Required configuration options, no defaults are used here */
  // tslint:disable-next-line:no-empty-interface
  export interface Required {}

  /** Available configuration settings in a runtime application */
  export interface Runtime extends Defaults, Required {}
}
