import { MinimalRequestExtraction } from "../../../src/components/unifier/interfaces";
import { createRequestScope } from "../../support/util/setup";

import { ResponseFactory } from "../../../src/components/unifier/response-factory";
import { SimpleVoiceResponse } from "../../../src/components/unifier/responses/simple-voice-response";
import { VoiceResponse } from "../../../src/components/unifier/responses/voice-response";
import { SSMLResponse } from "../../../src/components/unifier/responses/ssml-response";
import { UnauthenticatedResponse } from "../../../src/components/unifier/responses/unauthenticated-response";
import { EmptyResponse } from "../../../src/components/unifier/responses/empty-response";

import { Container } from "inversify-components";
import { ChatResponse } from "../../../src/components/unifier/responses/chat-response";
import { SuggestionChipsResponse } from "../../../src/components/unifier/responses/suggestion-chips-response";

describe("ResponseFactory", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.handler = this.container.inversifyInstance.get("core:unifier:current-response-handler");
    this.responseFactory = this.container.inversifyInstance.get("core:unifier:current-response-factory");
  });

  it("uses handler correctly as di argument", function() {
    expect(this.handler).toEqual(this.responseFactory.handler);
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

    describe("createSuggestionChipsResponse", function() {
      it("throws an exception", function() {
        expect(() => {
          this.responseFactory.createSuggestionChipsResponse();
        }).toThrow();
      });
    });

    describe("createChatResponse", function() {
      it("throws an exception", function() {
        expect(() => {
          this.responseFactory.createChatResponse();
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
        this.handler = Object.assign(this.handler, { sendResponse: () => this.sent = true });
        this.responseFactory = new ResponseFactory(this.handler);

        this.responseFactory.createAndSendEmptyResponse();
        expect(this.sent).toBeTruthy();
      });
    });
  });

  describe("with handler as SSML enabled handler", function() {
    beforeEach(function() {
      this.handler = Object.assign(this.handler, { isSSML: false });
      this.responseFactory = new ResponseFactory(this.handler);
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

  describe("with handler as chat messages enabled handler", function() {
    beforeEach(function() {
      this.handler = Object.assign(this.handler, { chatBubbles: null });
      this.responseFactory = new ResponseFactory(this.handler);
    });

    describe("createChatResponse", function() {
      it("creates instance correclty", function() {
        expect(this.responseFactory.createChatResponse().constructor).toEqual(ChatResponse);
      });
    });
  });

  describe("with handler as suggestion chips enabled handler", function() {
    beforeEach(function() {
      this.handler = Object.assign(this.handler, { suggestionChips: null });
      this.responseFactory = new ResponseFactory(this.handler);
    });

    describe("createSuggestionChipsResponse", function() {
      it("creates instance correclty", function() {
        expect(this.responseFactory.createSuggestionChipsResponse().constructor).toEqual(SuggestionChipsResponse);
      });
    });
  });

  describe("with handler as OAuth enabled handler", function() {
    beforeEach(function() {
      this.sent = false;
      this.handler = Object.assign(this.handler, {
        sendResponse: () => this.sent = true,
        forceAuthenticated: false
      });

      this.responseFactory = new ResponseFactory(this.handler);
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