import { ResponseFactory } from "../../../../src/components/unifier/response-factory";
import { VoiceResponse } from "../../../../src/components/unifier/responses/voice-response";
import { createRequestScope } from "../../../support/util/setup";

describe("VoiceResponse", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.handler = this.container.inversifyInstance.get("core:unifier:current-response-handler");
    this.handler = {...this.handler,  isSSML: false};
    this.responseFactory = this.container.inversifyInstance.get("core:unifier:current-response-factory");

    this.voiceResponse = this.responseFactory.createVoiceResponse();
    spyOn(this.voiceResponse.simple, "endSessionWith");
    spyOn(this.voiceResponse.ssml, "endSessionWith");
  });

  describe("with ssml input", function() {
    it("uses ssml handler", function() {
      const input = "<speak>Test</speak>";

      this.voiceResponse.endSessionWith(input);
      expect(this.voiceResponse.ssml.endSessionWith).toHaveBeenCalledWith(input);
      expect(this.voiceResponse.simple.endSessionWith).not.toHaveBeenCalled();
    });
  });

  describe("without ssml input", function() {
    it("uses ssml handler", function() {
      const input = "Test";

      this.voiceResponse.endSessionWith(input);
      expect(this.voiceResponse.simple.endSessionWith).toHaveBeenCalledWith(input);
      expect(this.voiceResponse.ssml.endSessionWith).not.toHaveBeenCalled();
    });
  });
});
