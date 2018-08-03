import { Container } from "inversify-components";
import { Logger, OptionalHandlerFeatures, SpecSetup } from "../../../../src/assistant-source";
import { SimpleVoiceResponse } from "../../../../src/components/unifier/responses/simple-voice-response";
import { ResponseHandler } from "../../../support/mocks/unifier/handler";
import { createRequestScope } from "../../../support/util/setup";

interface CurrentThisContext {
  handler: ResponseHandler & OptionalHandlerFeatures.Reprompt;
  simpleVoiceResponse: SimpleVoiceResponse;
  logger: Logger;
  specHelper: SpecSetup;
  container: Container;
}

describe("VoiceResponse", function() {
  beforeEach(function(this: CurrentThisContext) {
    // Remove emitting of warnings
    this.specHelper.bindSpecLogger("error");

    createRequestScope(this.specHelper);
    this.handler = this.container.inversifyInstance.get("core:unifier:current-response-handler");
    this.logger = this.container.inversifyInstance.get("core:root:current-logger");

    spyOn(this.handler, "sendResponse").and.returnValue(true);
    this.simpleVoiceResponse = new SimpleVoiceResponse(this.handler, false, this.logger);
  });

  describe("endSessionWith", function() {
    beforeEach(function(this: CurrentThisContext) {
      spyOn(this.simpleVoiceResponse, "endSessionWith").and.callThrough();
    });

    beforeEach(async function(this: CurrentThisContext) {
      this.simpleVoiceResponse.endSessionWith("test string");
    });

    it("sets text", function(this: CurrentThisContext) {
      expect(this.handler.voiceMessage).toEqual("test string");
    });

    it("ends session", function(this: CurrentThisContext) {
      expect(this.handler.endSession).toBeTruthy();
    });

    it("sends response", function(this: CurrentThisContext) {
      expect(this.handler.sendResponse).toHaveBeenCalled();
    });

    describe("with string as parameter", function() {
      it("does not return a Promise", async function(this: CurrentThisContext) {
        expect((this.simpleVoiceResponse.endSessionWith("test string") as any) instanceof Promise).toBeFalsy();
      });
    });

    describe("with Promise<string> as parameter", function() {
      it("returns a promise", async function(this: CurrentThisContext) {
        expect(this.simpleVoiceResponse.endSessionWith(Promise.resolve("test string")).then).toBeTruthy();
      });
    });
  });

  describe("prompt", function() {
    it("sets text", function(this: CurrentThisContext) {
      this.simpleVoiceResponse.prompt("test string");
      expect(this.handler.voiceMessage).toEqual("test string");
    });

    it("does not end session", function(this: CurrentThisContext) {
      this.simpleVoiceResponse.prompt("test string");
      expect(this.handler.endSession).toBeFalsy();
    });

    it("sends response", function(this: CurrentThisContext) {
      this.simpleVoiceResponse.prompt("test string");
      expect(this.handler.sendResponse).toHaveBeenCalled();
    });

    describe("with reprompts given", function() {
      describe("with a handler not supporting reprompts", function() {
        it("throws exception", async function(this: CurrentThisContext) {
          try {
            await this.simpleVoiceResponse.prompt("test string", "my reprompt", "my reprompt 2");
            fail();
          } catch (e) {
            expect(e.message).toContain("The currently used platform does not support reprompting.");
          }
        });
      });

      describe("with a handler supporting reprompts", function() {
        beforeEach(function(this: CurrentThisContext) {
          Object.assign(this.handler, { reprompts: null });
        });

        it("sets reprompts", function(this: CurrentThisContext) {
          this.simpleVoiceResponse.prompt("test string", "my reprompt", "my reprompt 2");
          expect(this.handler.reprompts).toEqual(["my reprompt", "my reprompt 2"]);
        });
      });
    });
  });
});
