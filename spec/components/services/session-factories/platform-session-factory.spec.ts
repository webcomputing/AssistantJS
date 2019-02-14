import { BasicHandable, BasicHandler, injectionNames, MinimalRequestExtraction, OptionalExtractions } from "../../../../src/assistant-source";
import { PlatformSession } from "../../../../src/components/services/session-factories/platform-session";
import { PlatformSessionFactory } from "../../../../src/components/services/session-factories/platform-session-factory";
import { BasicSessionHandable } from "../../../../src/components/unifier/response-handler";
import { createRequestScope } from "../../../helpers/scope";
import { PLATFORM } from "../../../support/mocks/unifier/extraction";
import { MockHandlerA } from "../../../support/mocks/unifier/response-handler/mock-handler-a";
import { MockHandlerB } from "../../../support/mocks/unifier/response-handler/mock-handler-b";
import { ThisContext } from "../../../this-context";

interface CurrentThisContext extends ThisContext {
  extraction: MinimalRequestExtraction & OptionalExtractions.SessionData;
  sessionHandler: BasicSessionHandable<any>;
  sessionFactory: PlatformSessionFactory;
  prepareCurrentSpecSetup: (responseHandler?: new (...args: any[]) => BasicHandable<any>) => void;
}

describe("PlatformSessionFactory", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    this.prepareCurrentSpecSetup = (responseHandler: new (...args: any[]) => BasicHandable<any> = MockHandlerA) => {
      createRequestScope(this.specHelper, undefined, undefined, responseHandler);

      this.extraction = this.inversify.get(injectionNames.current.extraction);
      this.sessionHandler = this.inversify.get(injectionNames.current.responseHandler);

      this.sessionFactory = new PlatformSessionFactory(this.extraction, this.sessionHandler);
    };
  });

  describe("#getCurrentSession", function() {
    describe("with responseHandler not having support for sessionData", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.prepareCurrentSpecSetup(MockHandlerB);
      });

      describe("with extraction having support for sessionData", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.extraction.sessionData = null;
        });

        it("throws error", async function(this: CurrentThisContext) {
          expect(() => this.sessionFactory.getCurrentSession()).toThrowError();
        });
      });
    });

    describe("with responseHandler having support for sessionData", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.prepareCurrentSpecSetup();
        this.sessionHandler.setSessionData(null);
      });

      describe("with extraction not having support for sessionData", function() {
        beforeEach(async function(this: CurrentThisContext) {
          delete this.extraction.sessionData;
        });

        it("throws error", async function(this: CurrentThisContext) {
          expect(() => this.sessionFactory.getCurrentSession()).toThrowError();
        });
      });

      describe("with extraction having support for sessionData", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.extraction.sessionData = null;
        });

        it("returns session data with extraction and handler configured", async function(this: CurrentThisContext) {
          expect(this.sessionFactory.getCurrentSession()).toEqual(new PlatformSession(this.extraction, this.sessionHandler));
        });
      });
    });
  });
});
