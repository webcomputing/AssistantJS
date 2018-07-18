import { PlatformSessionMirror } from "../../../../src/components/services/session-factories/platform-session-mirror";
import { componentInterfaces } from "../../../../src/components/unifier/private-interfaces";
import { BeforeResponseHandler, MinimalRequestExtraction, OptionalExtractions } from "../../../../src/components/unifier/public-interfaces";
import { BasicSessionHandable } from "../../../../src/components/unifier/response-handler";
import { injectionNames } from "../../../../src/injection-names";
import { createRequestScope } from "../../../support/util/setup";
import { ThisContext } from "../../../this-context";

interface CurrentThisContext extends ThisContext {
  extraction: MinimalRequestExtraction & OptionalExtractions.SessionData;
  handler: BasicSessionHandable<any>;
  mirror: PlatformSessionMirror;
  buildMirror(): PlatformSessionMirror;
}

describe("PlatformSessionMirror", function() {
  beforeEach(async function(this: CurrentThisContext) {
    createRequestScope(this.specHelper);

    this.extraction = this.container.inversifyInstance.get(injectionNames.current.extraction);
    this.handler = this.container.inversifyInstance.get(injectionNames.current.responseHandler);

    // Make extraction compatible per default
    this.extraction.sessionData = null;

    this.buildMirror = () => new PlatformSessionMirror(this.extraction);
  });

  it("is bound to responseHandler's beforeSendResponse extension", async function(this: CurrentThisContext) {
    expect(
      this.container.inversifyInstance
        .getAll<BeforeResponseHandler<any, any>>(componentInterfaces.beforeSendResponse)
        .filter(object => object.constructor.name === PlatformSessionMirror.name).length
    ).toEqual(1);
  });

  describe("#execute", function() {
    describe("with no compatible responseHandler", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.handler.setSessionData(undefined);

        // remove session capability
        (this.handler as any).specificWhitelist = this.handler.specificWhitelist.filter(value => value !== "setSessionData");
      });

      describe("with no session data stored in extraction", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.mirror = this.buildMirror();
        });

        it("does nothing", async function(this: CurrentThisContext) {
          this.mirror.execute(this.handler);
          expect(await this.handler.getSessionData()).toBeUndefined();
        });
      });

      describe("with data stored in extraction", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.extraction.sessionData = "{}";
          this.mirror = this.buildMirror();
        });

        it("throws exception", async function(this: CurrentThisContext) {
          try {
            await this.mirror.execute(this.handler);
            fail("Expected to throw Error");
          } catch (e) {
            expect(true).toBe(true);
          }
        });
      });

      describe("with no compatible extraction", function() {
        beforeEach(async function(this: CurrentThisContext) {
          delete this.extraction.sessionData;
          this.mirror = this.buildMirror();
        });

        it("does nothing", async function(this: CurrentThisContext) {
          this.mirror.execute(this.handler);
          expect(await this.handler.getSessionData()).toBeUndefined();
        });
      });
    });

    describe("with compatible responseHandler", function() {
      beforeEach(async function(this: CurrentThisContext) {
        (this.handler as any).promises.sessionData = undefined;
      });

      describe("with no extractionData", function() {
        it("does nothing", async function(this: CurrentThisContext) {
          await this.buildMirror().execute(this.handler);
          expect(await this.handler.getSessionData()).toBeUndefined();
        });
      });

      describe("with extractionData", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.extraction.sessionData = "a";
        });

        it("mirrors extraction's sessionData to handler's sessionData", async function(this: CurrentThisContext) {
          await this.buildMirror().execute(this.handler);
          expect(await this.handler.getSessionData()).toEqual("a");
        });

        describe("with responseHandler having sth stored in sessionData", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.handler.setSessionData("b");
          });

          it("does nothing", async function(this: CurrentThisContext) {
            this.buildMirror().execute(this.handler);
            expect(await this.handler.getSessionData()).toEqual("b");
          });
        });
      });
    });
  });
});
