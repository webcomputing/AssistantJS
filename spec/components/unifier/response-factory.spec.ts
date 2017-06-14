import { MinimalRequestExtraction } from "../../../src/components/unifier/interfaces";
import { createRequestScope } from "../../support/util/setup";

import { ResponseFactory } from "../../../src/components/unifier/response-factory";
import { SimpleVoiceResponse } from "../../../src/components/unifier/responses/simple-voice-response";
import { VoiceResponse } from "../../../src/components/unifier/responses/voice-response";
import { SSMLResponse } from "../../../src/components/unifier/responses/ssml-response";
import { UnauthenticatedResponse } from "../../../src/components/unifier/responses/unauthenticated-response";
import { EmptyResponse } from "../../../src/components/unifier/responses/empty-response";

describe("ResponseFactory", function() {
  beforeEach(function() {
    createRequestScope(this.assistantJs);
    this.extraction = this.container.inversifyInstance.get("core:unifier:current-extraction");
    this.responseFactory = this.container.inversifyInstance.get("core:unifier:current-response-factory");
  });

  it("uses extraction correctly as di argument", function() {
    expect(this.extraction).toEqual(this.responseFactory.extraction);
  })

  describe("with extraction as a MinimalRequestExtraction", function() {
    describe("createVoiceResponse", function() {
      it("creates instance correctly", function() {
        expect(this.responseFactory.createVoiceResponse().constructor).toEqual(VoiceResponse);
      });

      it("creates instance without SSML", function() {
        expect(this.responseFactory.createVoiceResponse().simple.constructor).toEqual(SimpleVoiceResponse);
        expect(this.responseFactory.createVoiceResponse().ssml.constructor).toEqual(SimpleVoiceResponse);
      });
    });

    describe("createSimpleVoiceResponse", function() {
      it("creates instance correctly", function() {
        expect(this.responseFactory.createSimpleVoiceResponse().constructor).toEqual(SimpleVoiceResponse);
      })
    });

    describe("createSSMLResponse", function() {
      it("throws an exception", function() {
        expect(() => {
          this.responseFactory.createSSMLResponse();
        }).toThrow();
      });
    });

    describe("createAndSendUnauthenticatedResponse", function() {
      it("throws an exception", function() {
        expect(() => {
          this.responseFactory.createAndSendUnauthenticatedResponse();
        }).toThrow();
      });
    });

    describe("createAndSendEmptyResponse", function() {
      it("creates instance correctly", function() {
        expect(this.responseFactory.createAndSendEmptyResponse().constructor).toEqual(EmptyResponse);
      });

      it("sends an empty response", function() {
        this.sent = false;
        this.extraction.getHandler = () => {return {sendResponse: () => this.sent = true};}

        this.responseFactory.createAndSendEmptyResponse();
        expect(this.sent).toBeTruthy();
      });
    });
  });

  describe("with extraction as SSML enabled extraction", function() {
    beforeEach(function() {
      let oldHandler = this.extraction.getHandler();
      this.extraction.getHandler = () => Object.assign(oldHandler, { isSSML: false });
      this.responseFactory = new ResponseFactory(this.extraction);
    });

    describe("createSSMLResponse", function() {
      it("creates instance correclty", function() {
        expect(this.responseFactory.createSSMLResponse().constructor).toEqual(SSMLResponse);
      });
    });

    describe("createVoiceResponse", function() {
      it("creates instance with SSML", function() {
        expect(this.responseFactory.createVoiceResponse().simple.constructor).toEqual(SimpleVoiceResponse);
        expect(this.responseFactory.createVoiceResponse().ssml.constructor).toEqual(SSMLResponse);
      });
    })
  });

  describe("with extraction as OAuth enabled extraction", function() {
    beforeEach(function() {
      this.sent = false;
      this.extraction.getHandler = () => {return {
        sendResponse: () => this.sent = true,
        forceAuthenticated: false
      };}

      this.responseFactory = new ResponseFactory(this.extraction);
    });

    describe("createAndSendUnauthenticatedResponse", function() {
      it("creates instance correctly", function() {
        expect(this.responseFactory.createAndSendUnauthenticatedResponse().constructor).toEqual(UnauthenticatedResponse);
      });

      it("sends a response", function() {
        this.responseFactory.createAndSendUnauthenticatedResponse();
        expect(this.sent).toBeTruthy();
      });
    });
  });
});