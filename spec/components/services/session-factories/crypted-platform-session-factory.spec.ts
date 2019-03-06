import { SessionConfiguration } from "../../../../src/components/services/private-interfaces";
import { CryptedPlatformSessionFactory } from "../../../../src/components/services/session-factories/crypted-platform-session-factory";
import { MinimalRequestExtraction, OptionalExtractions } from "../../../../src/components/unifier/public-interfaces";
import { BasicSessionHandable } from "../../../../src/components/unifier/response-handler";
import { injectionNames } from "../../../../src/injection-names";
import { createRequestScope } from "../../../helpers/scope";
import { ThisContext } from "../../../this-context";

interface CurrentThisContext extends ThisContext {
  extraction: MinimalRequestExtraction & OptionalExtractions.SessionData;
  handler: BasicSessionHandable<any>;
  sessionFactory: CryptedPlatformSessionFactory;
}

const encryptionKey = "asdfghjklasdfghjklasdfghjklasdfg";

describe("CryptedPlatformSessionFactory", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    createRequestScope(this.specHelper);
    this.extraction = this.inversify.get(injectionNames.current.extraction);
    this.handler = this.inversify.get(injectionNames.current.responseHandler);

    this.sessionFactory = new CryptedPlatformSessionFactory(this.extraction, this.handler);
  });

  describe("#getCurrentSession", function() {
    describe("with encryption key given", function() {
      it("returns session with given encryption key", async function(this: CurrentThisContext) {
        const configuration: SessionConfiguration.CryptedPlatform = { encryptionKey };
        const cryptedSession = this.sessionFactory.getCurrentSession(configuration);

        // tslint:disable-next-line:no-string-literal
        expect(cryptedSession["encryptionKey"]).toEqual(encryptionKey);
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
