import { RedisClient } from "redis";
import { Session } from "../public-interfaces";

export class RedisSession implements Session {
  /**
   * Creates a redis-based session
   * @param id ID of session
   * @param redisInstance Instance of redis handler to use
   * @param maxLifeTime Maximum lifetime of a session
   */
  constructor(public id: string, private redisInstance: RedisClient, private maxLifeTime: number) {}

  public async get(field: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.redisInstance.hget(this.documentID, field, (err, value) => {
        if (!err) {
          resolve(value);
        } else {
          reject(err);
        }
      });
    });
  }

  public async set(field: string, value: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.redisInstance.hset(this.documentID, field, value, err => {
        if (!err) {
          resolve();

          // Reset expire counter to maxLifeTime
          this.redisInstance.expire(this.documentID, this.maxLifeTime);
        } else {
          reject(err);
        }
      });
    });
  }

  public delete(field: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.redisInstance.hdel(this.documentID, field, err => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }

  public deleteAllFields(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.redisInstance.del(this.documentID, (err, response) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }

  public exists(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.redisInstance.hlen(this.documentID, (err, response) => {
        if (!err) {
          resolve(response > 0);
        } else {
          reject(err);
        }
      });
    });
  }

  private get documentID() {
    return "session-" + this.id;
  }
}
