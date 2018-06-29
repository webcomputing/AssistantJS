import * as fakeRedis from "fakeredis";
import { Component, Container } from "inversify-components";
import { RedisClient } from "redis";
import { Configuration } from "../../../../src/components/services/private-interfaces";
import { RedisSession } from "../../../../src/components/services/session-factories/redis-session";

interface CurrentThisContext {
  session: RedisSession;
  redisInstance: RedisClient;
}

// Let each redis session spec run in a different fakeRedis environment
let redisSessionSpecId = 0;

describe("RedisSession", function() {
  beforeEach(function(this: CurrentThisContext) {
    this.redisInstance = fakeRedis.createClient(6379, `redisSession-instance-${++redisSessionSpecId}`, { fast: true });
    this.session = new RedisSession("example-session", this.redisInstance, 1800);
  });

  describe("#set", function() {
    describe("if successful", function() {
      beforeEach(async function(done) {
        await this.session.set("my-key", "my-value");
        done();
      });

      it("sets expires counter", function(done) {
        // We don't have to bother about race conditions here since we are using fakredis in tests :-)
        this.redisInstance.ttl(this.session.documentID, function(err, ttl) {
          expect(ttl).toBeCloseTo(1800, 5);
          done();
        });
      });
    });
  });

  describe("#exists", function() {
    describe("with existing hash", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.session.set("my-key", "my-value");
      });

      it("returns true", async function(this: CurrentThisContext) {
        expect(await this.session.exists()).toBeTruthy();
      });
    });

    describe("without existing hash", function() {
      it("returns false", async function(this: CurrentThisContext) {
        expect(await this.session.exists()).toBeFalsy();
      });
    });
  });
});
