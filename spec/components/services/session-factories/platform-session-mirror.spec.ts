import { PlatformSessionMirror } from "../../../../src/components/services/session-factories/platform-session-mirror";
import { componentInterfaces } from "../../../../src/components/unifier/private-interfaces";
import { BeforeResponseHandler, MinimalRequestExtraction, OptionalExtractions } from "../../../../src/components/unifier/public-interfaces";
import { BasicHandable, BasicSessionHandable } from "../../../../src/components/unifier/response-handler";
import { injectionNames } from "../../../../src/injection-names";
import { MockHandlerA } from "../../../support/mocks/unifier/response-handler/mock-handler-a";
import { MockHandlerB } from "../../../support/mocks/unifier/response-handler/mock-handler-b";
import { createRequestScope } from "../../../support/util/setup";
import { ThisContext } from "../../../this-context";

interface CurrentThisContext extends ThisContext {
  extraction: MinimalRequestExtraction & OptionalExtractions.SessionData;
  handler: BasicSessionHandable<any>;
  mirror: PlatformSessionMirror;
  getSessionDataSpy: jasmine.Spy;
  prepareSetup(handleConstructor?: { new (...args: any[]): BasicHandable<any> }): void;
  buildMirror(): PlatformSessionMirror;
  createGetSessionDataSpy(): void;
}

describe("PlatformSessionMirror", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.prepareSetup = (handleConstructor: { new (...args: any[]): BasicHandable<any> } = MockHandlerA) => {
      createRequestScope(this.specHelper, undefined, undefined, handleConstructor);
      this.extraction = this.container.inversifyInstance.get(injectionNames.current.extraction);
      this.handler = this.container.inversifyInstance.get(injectionNames.current.responseHandler);
      // Make extraction compatible per default
      this.extraction.sessionData = null;
      this.buildMirror = () => new PlatformSessionMirror(this.extraction);
      this.createGetSessionDataSpy = () => {
        this.getSessionDataSpy = jasmine.createSpy().and.callFake(() => {
          // do nothing
          return this.handler;
        });
        this.handler.getSessionData = this.getSessionDataSpy;
      };
    };
  });

  describe("when binding happens ", function() {
    beforeEach(async function(this: CurrentThisContext) {
      this.prepareSetup();
    });

    it("is bound to responseHandler's beforeSendResponse extension", async function(this: CurrentThisContext) {
      expect(
        this.container.inversifyInstance
          .getAll<BeforeResponseHandler<any, any>>(componentInterfaces.beforeSendResponse)
          .filter(object => object.constructor.name === PlatformSessionMirror.name).length
      ).toEqual(1);
    });
  });

  describe("#execute", function() {
    describe("with no compatible responseHandler", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.prepareSetup(MockHandlerB);
      });

      describe("with no session data stored in extraction", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.mirror = this.buildMirror();
          this.createGetSessionDataSpy();
        });

        it("does nothing", async function(this: CurrentThisContext) {
          await this.mirror.execute(this.handler);
          expect(this.getSessionDataSpy).not.toHaveBeenCalled();
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
          this.createGetSessionDataSpy();
        });

        it("does nothing", async function(this: CurrentThisContext) {
          await this.mirror.execute(this.handler);
          expect(this.getSessionDataSpy).not.toHaveBeenCalled();
        });
      });
    });

    describe("with compatible responseHandler", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.prepareSetup();

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
