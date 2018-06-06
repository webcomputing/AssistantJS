import { Container } from "inversify-components";
import { RedisClient } from "redis";
import { Session, SessionFactory } from "../../../src/assistant-source";

interface CurrentThisContext {
  session: Session;
  sessionFactory: SessionFactory;
  container: Container;
  redisInstance: RedisClient;
}

describe("Session", function() {
  beforeEach(function(this: CurrentThisContext) {
    this.sessionFactory = this.container.inversifyInstance.get("core:services:session-factory");
    this.redisInstance = this.container.inversifyInstance.get("core:services:redis-instance");
    this.session = this.sessionFactory("example-session");
  });

  describe("set", function() {
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

  describe("find", function() {
    describe("with existing hash", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.session.set("my-key", "my-value");
        await this.session.set("not-the-key", "not-the-value");
      });

      it("returns array with my-value", async function(this: CurrentThisContext) {
        expect(await this.session.find("my-")).toEqual({ "my-key": "my-value" });
      });

      it("returns array with my-value and not-the-value", async function(this: CurrentThisContext) {
        expect(await this.session.find("")).toEqual({
          "my-key": "my-value",
          "not-the-key": "not-the-value",
        });
      });

      it("returns array with my-value and not-the-value", async function(this: CurrentThisContext) {
        expect(await this.session.find("key")).toEqual({ "my-key": "my-value", "not-the-key": "not-the-value" });
      });

      it("returns array with not-the-value", async function(this: CurrentThisContext) {
        expect(await this.session.find("the")).toEqual({ "not-the-key": "not-the-value" });
      });
    });
  });

  describe("exists", function() {
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
