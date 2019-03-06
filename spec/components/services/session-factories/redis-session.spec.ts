import * as fakeRedis from "fakeredis";
import { RedisClient } from "redis";
import { RedisSession } from "../../../../src/components/services/session-factories/redis-session";
import { ThisContext } from "../../../this-context";

interface CurrentThisContext extends ThisContext {
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
        // We don't have to bother about race conditions here since we are using fakeredis in tests :-)
        this.redisInstance.ttl(this.session.documentID, function(err, ttl) {
          expect(ttl).toBeCloseTo(1800, 5);
          done();
        });
      });
    });
  });

  describe("#getSubset", function() {
    interface CurrentThisContextGetSubset extends CurrentThisContext {
      sessionData: { [key: string]: string };
    }

    beforeEach(async function(this: CurrentThisContextGetSubset) {
      await this.session.set("my-key", "my-value");
      await this.session.set("not-the-key", "not-the-value");
    });

    describe("with parameter 'my-'", function() {
      beforeEach(async function(this: CurrentThisContextGetSubset) {
        this.sessionData = await this.session.getSubset("my-");
      });

      it("returns a hash of my-value", async function(this: CurrentThisContextGetSubset) {
        expect(this.sessionData).toEqual({ "my-key": "my-value" });
      });

      it("does not return a hash of not-the-value", async function(this: CurrentThisContextGetSubset) {
        expect(this.sessionData).not.toEqual({ "not-the-key": "not-the-value" });
      });
    });

    describe("with parameter 'key'", function() {
      beforeEach(async function(this: CurrentThisContextGetSubset) {
        this.sessionData = await this.session.getSubset("key");
      });

      it("returns a hash of my-value and not-the-value", async function(this: CurrentThisContextGetSubset) {
        expect(this.sessionData).toEqual({
          "my-key": "my-value",
          "not-the-key": "not-the-value",
        });
      });
    });

    describe("with parameter ''", function() {
      beforeEach(async function(this: CurrentThisContextGetSubset) {
        this.sessionData = await this.session.getSubset("");
      });

      it("returns a hash of my-value and not-the-value", async function(this: CurrentThisContextGetSubset) {
        expect(this.sessionData).toEqual({
          "my-key": "my-value",
          "not-the-key": "not-the-value",
        });
      });
    });

    describe("without parameter", function() {
      beforeEach(async function(this: CurrentThisContextGetSubset) {
        this.sessionData = await this.session.getSubset();
      });

      it("returns a hash of my-value and not-the-value", async function(this: CurrentThisContextGetSubset) {
        expect(this.sessionData).toEqual({
          "my-key": "my-value",
          "not-the-key": "not-the-value",
        });
      });
    });

    describe("with parameter 'not-the'", function() {
      beforeEach(async function(this: CurrentThisContextGetSubset) {
        this.sessionData = await this.session.getSubset("not-the");
      });

      it("returns a hash of not-the-value", async function(this: CurrentThisContextGetSubset) {
        expect(this.sessionData).toEqual({
          "not-the-key": "not-the-value",
        });
      });
    });
  });

  describe("#listKeys", function() {
    interface CurrentThisContextListKeys extends CurrentThisContext {
      sessionData: string[];
    }
    beforeEach(async function(this: CurrentThisContext) {
      await this.session.set("my-key", "my-value");
      await this.session.set("the-key", "the-value");
    });

    describe("with existing hash", function() {
      describe("with parameter 'my-'", function() {
        beforeEach(async function(this: CurrentThisContextListKeys) {
          this.sessionData = await this.session.listKeys("my-");
        });

        it("returns an array with my-key", async function(this: CurrentThisContextListKeys) {
          expect(this.sessionData).toEqual(["my-key"]);
        });
      });

      describe("with parameter 'the'", function() {
        beforeEach(async function(this: CurrentThisContextListKeys) {
          this.sessionData = await this.session.listKeys("the");
        });

        it("returns an array with the-key", async function(this: CurrentThisContextListKeys) {
          expect(this.sessionData).toEqual(["the-key"]);
        });
      });

      describe("with parameter ''", function() {
        beforeEach(async function(this: CurrentThisContextListKeys) {
          this.sessionData = await this.session.listKeys("");
        });

        it("return an array with my-key and the-key", async function(this: CurrentThisContextListKeys) {
          expect(this.sessionData).toEqual(["my-key", "the-key"]);
        });

        it("does not return an empty array", async function(this: CurrentThisContextListKeys) {
          expect(this.sessionData).not.toEqual([]);
        });
      });

      describe("without parameter", function() {
        beforeEach(async function(this: CurrentThisContextListKeys) {
          this.sessionData = await this.session.listKeys();
        });

        it("return an array with my-key and the-key", async function(this: CurrentThisContextListKeys) {
          expect(this.sessionData).toEqual(["my-key", "the-key"]);
        });

        it("does not return an empty array", async function(this: CurrentThisContextListKeys) {
          expect(this.sessionData).not.toEqual([]);
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
