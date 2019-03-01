import { Logger } from "../../../src/assistant-source";
import { createUnifierLoggerMiddleware } from "../../../src/components/unifier/logger-middleware";
import { injectionNames } from "../../../src/injection-names";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  params: {};
  logger: Logger;
}

describe("created function of createUnifierLoggerMiddleware", function() {
  beforeEach(function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    this.logger = this.inversify.get(injectionNames.logger);
  });

  describe("with no extraction given", function() {
    it("does nothing", function() {
      expect(createUnifierLoggerMiddleware()(this.logger)).toEqual(this.logger);
    });
  });

  describe("with no sessionID in extraction given", function() {
    it("does nothing", function() {
      expect(createUnifierLoggerMiddleware()(this.logger)).toEqual(this.logger);
    });
  });

  describe("with a valid extraction given", function() {
    beforeEach(function(this: CurrentThisContext) {
      this.specHelper.prepareSpec(this.defaultSpecOptions);
      this.params = { sessionID: "mySessionID", platform: "myPlatform" };
    });

    it("returns child logger with sessionID", function() {
      const childLogger = createUnifierLoggerMiddleware(this.params)(this.logger);
      expect(childLogger.fields.sessionSlug).toEqual("ca9e8f9");
    });

    it("returns child logger with platform", function() {
      const childLogger = createUnifierLoggerMiddleware(this.params)(this.logger);
      expect(childLogger.fields.platform).toEqual("myPlatform");
    });

    describe("with device given in extraction", function() {
      it("returns child logger with device name", function() {
        this.params = { device: "myDevice", ...this.params };
        const childLogger = createUnifierLoggerMiddleware(this.params)(this.logger);
        expect(childLogger.fields.device).toEqual("myDevice");
      });
    });
  });
});
