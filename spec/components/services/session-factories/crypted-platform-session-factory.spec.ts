import { SessionConfiguration } from "../../../../src/components/services/private-interfaces";
import { CryptedPlatformSessionFactory } from "../../../../src/components/services/session-factories/crypted-platform-session-factory";
import { PlatformSessionFactory } from "../../../../src/components/services/session-factories/platform-session-factory";
import {
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
  sessionFactory: CryptedPlatformSessionFactory;
}

describe("CryptedPlatformSessionFactory", function() {
  beforeEach(async function(this: CurrentThisContext) {
    createRequestScope(this.specHelper);

    this.extraction = this.container.inversifyInstance.get(injectionNames.current.extraction);
    this.handler = this.container.inversifyInstance.get(injectionNames.current.responseHandler);

    this.sessionFactory = new CryptedPlatformSessionFactory(this.extraction, this.handler);
  });

  describe("#getCurrentSession", function() {
    describe("with encryption key given", function() {
      it("returns session with given encryption key", async function(this: CurrentThisContext) {
        const configuration: SessionConfiguration.CryptedPlatform = { encryptionKey: "asdfghjklasdfghjklasdfghjklasdfg" };
        const cryptedSession = this.sessionFactory.getCurrentSession(configuration);

        // tslint:disable-next-line:no-string-literal
        expect(cryptedSession["encryptionKey"]).toEqual("asdfghjklasdfghjklasdfghjklasdfg");
      });
    });

    describe("without encryption key given", function() {
      it("returns session with generated encryption key", async function(this: CurrentThisContext) {
        const cryptedSession = this.sessionFactory.getCurrentSession();

        // tslint:disable-next-line:no-string-literal
        expect(cryptedSession["encryptionKey"].length).toEqual(32);
      });
    });
  });
});
