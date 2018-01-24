import { RedisClient } from "redis";

export interface Session {
  id: string;
  get(field: string): Promise<string>;
  set(field: string, value: string): Promise<void>;

  /** Deletes only the given field from this session */
  delete(field: string): Promise<void>;
}

export interface DestroyableSession extends Session {
  /** Deletes the whole session object */
  delete(): Promise<void>;
}

/** Factory function which returns a session for a given session id */
export interface SessionFactory {
  (id: string): DestroyableSession;
}

/** Factory function which returns the current session (based on extraction result) */
export interface CurrentSessionFactory {
  (): DestroyableSession;
}

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
  export interface Runtime extends Defaults, Required {};
}

/** Configuration object for AssistantJS user for services component */
export interface Configuration extends Partial<Configuration.Defaults>, Configuration.Required {}