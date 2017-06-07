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

export interface Configuration {
  redisClient: RedisClient;
}