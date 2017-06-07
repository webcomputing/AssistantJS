import { DestroyableSession } from "./interfaces";
import { RedisClient } from "redis";

export class Session implements DestroyableSession {
  id: string;
  redisInstance: RedisClient;

  constructor(id: string, redisInstance: RedisClient) {
    this.id = id;
    this.redisInstance = redisInstance;
  }

  async get(field: string): Promise<string> {
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

  async set(field: string, value: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.redisInstance.hset(this.documentID, field, value, err => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }

  delete(field?: string): Promise<void> {
    if (typeof(field) === "undefined") return this.destroySession();

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

  private destroySession():Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.redisInstance.del(this.documentID, (err, response) => {
        if (response === 1) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  }

  private get documentID () {
    return "session-" + this.id;
  }
}