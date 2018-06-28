import {
  injectionNames,
  MinimalRequestExtraction,
  MinimalResponseHandler,
  OptionalExtractions,
  OptionalHandlerFeatures,
} from "../../../../src/assistant-source";
import { PlatformSession } from "../../../../src/components/services/session-factories/platform-session";
import { PlatformSessionFactory } from "../../../../src/components/services/session-factories/platform-session-factory";
import { createRequestScope } from "../../../support/util/setup";
import { ThisContext } from "../../../this-context";

interface CurrentThisContext extends ThisContext {
  extraction: MinimalRequestExtraction & OptionalExtractions.SessionData;
  handler: MinimalResponseHandler & OptionalHandlerFeatures.SessionData;
  sessionFactory: PlatformSessionFactory;
}

describe("PlatformSessionFactory", function() {
  beforeEach(async function(this: CurrentThisContext) {
    createRequestScope(this.specHelper);

    this.extraction = this.container.inversifyInstance.get(injectionNames.current.extraction);
    this.handler = this.container.inversifyInstance.get(injectionNames.current.responseHandler);

    this.sessionFactory = new PlatformSessionFactory(this.extraction, this.handler);
  });

  describe("#getCurrentSession", function() {
    describe("with responseHandler not having support for sessionData", function() {
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
        this.handler.sessionData = null;
      });

      it("throws error", async function(this: CurrentThisContext) {
        expect(() => this.sessionFactory.getCurrentSession()).toThrowError();
      });

      describe("with extraction having support for sessionData", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.extraction.sessionData = null;
        });

        it("returns session data with extraction and handler configured", async function(this: CurrentThisContext) {
          expect(this.sessionFactory.getCurrentSession()).toEqual(new PlatformSession(this.extraction, this.handler));
        });
      });
    });
  });
});
