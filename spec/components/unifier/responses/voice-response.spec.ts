import { createRequestScope } from "../../../support/util/setup";
import { ResponseFactory } from "../../../../src/components/unifier/response-factory";
import { VoiceResponse } from "../../../../src/components/unifier/responses/voice-response";

describe("VoiceResponse", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.extraction = this.container.inversifyInstance.get("core:unifier:current-extraction");

    let oldHandler = this.extraction.getHandler();
    this.extraction.getHandler = () => Object.assign(oldHandler, { isSSML: false });
    this.responseFactory = new ResponseFactory(this.extraction);

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
    })
  });

  describe("without ssml input", function() {
    it("uses ssml handler", function() {
      const input = "Test";

      this.voiceResponse.endSessionWith(input);
      expect(this.voiceResponse.simple.endSessionWith).toHaveBeenCalledWith(input);
      expect(this.voiceResponse.ssml.endSessionWith).not.toHaveBeenCalled();
    })
  });
})