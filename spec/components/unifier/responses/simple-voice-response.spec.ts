import { SimpleVoiceResponse } from "../../../../src/components/unifier/responses/simple-voice-response";
import { createRequestScope } from "../../../support/util/setup";

describe("VoiceResponse", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.handler = this.container.inversifyInstance.get("core:unifier:current-response-handler");
    this.logger = this.container.inversifyInstance.get("core:root:current-logger");

    spyOn(this.handler, "sendResponse").and.returnValue(true);
    this.simpleVoiceResponse = new SimpleVoiceResponse(this.handler, false, this.logger);
  });

  describe("endSessionWith", function() {
    beforeEach(function() {
      this.simpleVoiceResponse.endSessionWith("test string");
    });

    it("sets text", function() {
      expect(this.handler.voiceMessage).toEqual("test string");
    });

    it("ends session", function() {
      expect(this.handler.endSession).toBeTruthy();
    });

    it("sends response", function() {
      expect(this.handler.sendResponse).toHaveBeenCalled();
    });
  });

  describe("prompt", function() {
    it("sets text", function() {
      this.simpleVoiceResponse.prompt("test string");
      expect(this.handler.voiceMessage).toEqual("test string");
    });

    it("does not end session", function() {
      this.simpleVoiceResponse.prompt("test string");
      expect(this.handler.endSession).toBeFalsy();
    });

    it("sends response", function() {
      this.simpleVoiceResponse.prompt("test string");
      expect(this.handler.sendResponse).toHaveBeenCalled();
    });

    describe("with reprompts given", function() {
      describe("with a handler not supporting reprompts", function() {
        it("throws exception", function() {
          expect(() => {
            this.simpleVoiceResponse.prompt("test string", "my reprompt", "my reprompt 2");
          }).toThrow();
        });
      });

      describe("with a handler supporting reprompts", function() {
        beforeEach(function() {
          Object.assign(this.handler, { reprompts: null });
        });

        it("sets reprompts", function() {
          this.simpleVoiceResponse.prompt("test string", "my reprompt", "my reprompt 2");
          expect(this.handler.reprompts).toEqual(["my reprompt", "my reprompt 2"]);
        });
      });
    });
  });
});
