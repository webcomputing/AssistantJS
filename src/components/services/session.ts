import { RedisClient } from "redis";
import { Session as SessionInterface } from "./public-interfaces";

export class Session implements SessionInterface {
  public id: string;
  public redisInstance: RedisClient;
  public maxLifeTime: number;

  constructor(id: string, redisInstance: RedisClient, maxLifeTime: number) {
    this.id = id;
    this.redisInstance = redisInstance;
    this.maxLifeTime = maxLifeTime;
  }

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

  private get documentID() {
    return "session-" + this.id;
  }
}
