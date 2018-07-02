import * as crypto from "crypto";
import { CryptedPlatformSession } from "../../../../src/components/services/session-factories/crypted-platform-session";
import { OptionalExtractions, OptionalHandlerFeatures } from "../../../../src/components/unifier/public-interfaces";

interface CurrentThisContext {
  handlerData: OptionalHandlerFeatures.SessionData;
  extractionData: OptionalExtractions.SessionData;
  session: CryptedPlatformSession;
  params: any;

  /** Returns a new session based on this.handlerData and this.extractionData */
  createSession(): CryptedPlatformSession;
}

fdescribe("CryptedPlatformSession", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.handlerData = { sessionData: null };
    this.extractionData = { sessionData: null };
    this.createSession = () => new CryptedPlatformSession(this.extractionData, this.handlerData);

    this.session = this.createSession();
  });

  describe("with no encryption key given", function() {
    it("creates one", async function(this: CurrentThisContext) {
      const session = new CryptedPlatformSession(this.extractionData, this.handlerData);

      // tslint:disable-next-line:no-string-literal
      expect(session["encryptionKey"].length).toEqual(32);
      // tslint:disable-next-line:no-string-literal
      expect(session["encryptionKey"]).toEqual(CryptedPlatformSession["encryptionKey"]);
    });
  });

  describe("with encryption key given", function() {
    it("takes the given one", async function(this: CurrentThisContext) {
      const session = new CryptedPlatformSession(this.extractionData, this.handlerData, "mykey");

      // tslint:disable-next-line:no-string-literal
      expect(session["encryptionKey"]).toEqual("mykey");
    });
  });

  describe("#encrypt", function() {
    it("encrypts given data", async function(this: CurrentThisContext) {
      const clearText = "this-is-my-cleartext";
      expect(await this.session.encrypt(clearText)).not.toEqual(clearText);
    });

    it("prepends initialization vector", async function(this: CurrentThisContext) {
      const clearText = "this-is-my-cleartext";
      expect((await this.session.encrypt(clearText)).split(":")[0].length).toEqual(32);
    });

    it("returns different crypts for same key and input", async function(this: CurrentThisContext) {
      const clearText = "this-is-my-cleartext";
      const [a, b] = [await this.session.encrypt(clearText), await this.session.encrypt(clearText)];
      expect(a).not.toEqual(b);
    });
  });

  describe("#decrypt", function() {
    it("decrypts previously encrypted data", async function(this: CurrentThisContext) {
      const clearText = "this-is-my-cleartext";
      const crypted = await this.session.encrypt(clearText);
      expect(crypted).not.toEqual(clearText);
      expect(await this.session.decrypt(crypted)).toEqual(clearText);
    });
  });
});
