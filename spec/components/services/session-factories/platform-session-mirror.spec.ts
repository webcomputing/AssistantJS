import { PlatformSessionMirror } from "../../../../src/components/services/session-factories/platform-session-mirror";
import { componentInterfaces } from "../../../../src/components/unifier/private-interfaces";
import {
  BeforeResponseHandler,
  MinimalRequestExtraction,
  MinimalResponseHandler,
  OptionalExtractions,
  OptionalHandlerFeatures,
} from "../../../../src/components/unifier/public-interfaces";
import { injectionNames } from "../../../../src/injection-names";
import { createRequestScope } from "../../../support/util/setup";
import { ThisContext } from "../../../this-context";

interface CurrentThisContext extends ThisContext {
  extraction: MinimalRequestExtraction & OptionalExtractions.SessionData;
  handler: MinimalResponseHandler & OptionalHandlerFeatures.SessionData;
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
        .getAll<BeforeResponseHandler>(componentInterfaces.beforeSendResponse)
        .filter(object => object.constructor.name === PlatformSessionMirror.name).length
    ).toEqual(1);
  });

  describe("#execute", function() {
    describe("with no compatible responseHandler", function() {
      describe("with no session data stored in extraction", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.mirror = this.buildMirror();
        });

        it("does nothing", async function(this: CurrentThisContext) {
          this.mirror.execute(this.handler);
          expect(this.handler.sessionData).toBeUndefined();
        });
      });

      describe("with data stored in extraction", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.extraction.sessionData = "{}";
          this.mirror = this.buildMirror();
        });

        it("throws exception", async function(this: CurrentThisContext) {
          expect(() => this.mirror.execute(this.handler)).toThrowError();
        });
      });

      describe("with no compatible extraction", function() {
        beforeEach(async function(this: CurrentThisContext) {
          delete this.extraction.sessionData;
          this.mirror = this.buildMirror();
        });

        it("does nothing", async function(this: CurrentThisContext) {
          this.mirror.execute(this.handler);
          expect(this.handler.sessionData).toBeUndefined();
        });
      });
    });

    describe("with compatible responseHandler", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.handler.sessionData = null;
      });

      describe("with no extractionData", function() {
        it("does nothing", async function(this: CurrentThisContext) {
          this.buildMirror().execute(this.handler);
          expect(this.handler.sessionData).toBeNull();
        });
      });

      describe("with extractionData", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.extraction.sessionData = "a";
        });

        it("mirrors extraction's sessionData to handler's sessionData", async function(this: CurrentThisContext) {
          this.buildMirror().execute(this.handler);
          expect(this.handler.sessionData).toEqual("a");
        });

        describe("with responseHandler having sth stored in sessionData", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.handler.sessionData = "b";
          });

          it("does nothing", async function(this: CurrentThisContext) {
            this.buildMirror().execute(this.handler);
            expect(this.handler.sessionData).toEqual("b");
          });
        });
      });
    });
  });
});
