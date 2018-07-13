import * as crypto from "crypto";
import { BasicHandler } from "../../../../src/assistant-source";
import { CryptedPlatformSession } from "../../../../src/components/services/session-factories/crypted-platform-session";
import { BasicAnswerTypes, OptionalExtractions } from "../../../../src/components/unifier/public-interfaces";
import { MockHandlerA } from "../../../support/mocks/unifier/response-handler/mock-handler-a";
import { ThisContext } from "../../../this-context";

interface CurrentThisContext extends ThisContext {
  handler: BasicHandler<any>;
  extractionData: OptionalExtractions.SessionData;
  session: CryptedPlatformSession;
  params: any;

  /** Returns a new session based on this.handlerData and this.extractionData */
  createSession(): CryptedPlatformSession;
}

describe("CryptedPlatformSession", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.handler = this.container.inversifyInstance.get(MockHandlerA);
    this.extractionData = { sessionData: null };
    this.createSession = () => new CryptedPlatformSession(this.extractionData, this.handler);

    this.session = this.createSession();
  });

  describe("with no encryption key given", function() {
    it("creates one", async function(this: CurrentThisContext) {
      const session = new CryptedPlatformSession(this.extractionData, this.handler);

      // tslint:disable-next-line:no-string-literal
      expect(session["encryptionKey"].length).toEqual(32);
      // tslint:disable-next-line:no-string-literal
      expect(session["encryptionKey"]).toEqual(CryptedPlatformSession["encryptionKey"]);
    });
  });

  describe("with encryption key given", function() {
    describe("with length != 32 characters", function() {
      it("throws exception", async function(this: CurrentThisContext) {
        expect(() => new CryptedPlatformSession(this.extractionData, this.handler, "12345678912345")).toThrow();
      });
    });

    describe("with length = 32 characters", function() {
      it("takes the given one", async function(this: CurrentThisContext) {
        const session = new CryptedPlatformSession(this.extractionData, this.handler, "12345678912345678912345678912345");

        // tslint:disable-next-line:no-string-literal
        expect(session["encryptionKey"]).toEqual("12345678912345678912345678912345");
      });
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

  describe("#set", function() {
    it("encrypts handlers output", async function(this: CurrentThisContext) {
      await this.session.set("a", "b");
      expect(this.session.decrypt(await this.handler.getSessionData())).toEqual(JSON.stringify({ a: "b" }));
    });
  });

  describe("#get", function() {
    it("works after set()", async function(this: CurrentThisContext) {
      await this.session.set("a", "b");
      expect(await this.session.get("a")).toEqual("b");
    });

    it("works for prefilled session", async function(this: CurrentThisContext) {
      this.session = this.createSession();
      this.extractionData.sessionData = await this.session.encrypt(JSON.stringify({ c: "d" }));
      expect(await this.session.get("c")).toEqual("d");
    });
  });
});
