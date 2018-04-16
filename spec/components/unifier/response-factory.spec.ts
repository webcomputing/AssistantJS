import { MinimalRequestExtraction } from "../../../src/components/unifier/public-interfaces";
import { createRequestScope } from "../../support/util/setup";

import { ResponseFactory } from "../../../src/components/unifier/response-factory";
import { EmptyResponse } from "../../../src/components/unifier/responses/empty-response";
import { SimpleVoiceResponse } from "../../../src/components/unifier/responses/simple-voice-response";
import { SSMLResponse } from "../../../src/components/unifier/responses/ssml-response";
import { UnauthenticatedResponse } from "../../../src/components/unifier/responses/unauthenticated-response";
import { VoiceResponse } from "../../../src/components/unifier/responses/voice-response";

import { Container } from "inversify-components";
import { ChatResponse } from "../../../src/components/unifier/responses/chat-response";
import { SuggestionChipsResponse } from "../../../src/components/unifier/responses/suggestion-chips-response";

describe("ResponseFactory", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.handler = this.container.inversifyInstance.get("core:unifier:current-response-handler");
    this.responseFactory = this.container.inversifyInstance.get("core:unifier:current-response-factory");
  });

  describe("failSilentlyOnUnsupportedFeatures", function() {
    it("is initialized with true", function() {
      expect(this.responseFactory.failSilentlyOnUnsupportedFeatures).toBeTruthy();
    });
  });

  it("uses handler correctly as di argument", function() {
    expect(this.handler).toEqual(this.responseFactory.handler);
  });

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
      });
    });

    describe("createSSMLResponse", function() {
      describe("with failSilentlyOnUnsupportedFeatures = false", function() {
        beforeEach(function() {
          this.responseFactory.failSilentlyOnUnsupportedFeatures = false;
        });

        it("throws an exception", function() {
          expect(() => {
            this.responseFactory.createSSMLResponse();
          }).toThrow();
        });
      });

      describe("with failSilentlyOnUnsupportedFeatures = true", function() {
        it("does not throw an exception", function() {
          expect(() => {
            this.responseFactory.createSSMLResponse();
          }).not.toThrow();
        });
      });
    });

    describe("createSuggestionChipsResponse", function() {
      describe("with failSilentlyOnUnsupportedFeatures = false", function() {
        beforeEach(function() {
          this.responseFactory.failSilentlyOnUnsupportedFeatures = false;
        });

        it("throws an exception", function() {
          expect(() => {
            this.responseFactory.createSuggestionChipsResponse();
          }).toThrow();
        });
      });

      describe("with failSilentlyOnUnsupportedFeatures = true", function() {
        it("does not throw an exception", function() {
          expect(() => {
            this.responseFactory.createSuggestionChipsResponse();
          }).not.toThrow();
        });
      });
    });

    describe("createChatResponse", function() {
      describe("with failSilentlyOnUnsupportedFeatures = false", function() {
        beforeEach(function() {
          this.responseFactory.failSilentlyOnUnsupportedFeatures = false;
        });

        it("throws an exception", function() {
          expect(() => {
            this.responseFactory.createChatResponse();
          }).toThrow();
        });
      });

      describe("with failSilentlyOnUnsupportedFeatures = true", function() {
        it("does not throw an exception", function() {
          expect(() => {
            this.responseFactory.createChatResponse();
          }).not.toThrow();
        });
      });
    });

    describe("createAndSendUnauthenticatedResponse", function() {
      describe("with failSilentlyOnUnsupportedFeatures = false", function() {
        beforeEach(function() {
          this.responseFactory.failSilentlyOnUnsupportedFeatures = false;
        });

        it("throws an exception", function() {
          expect(() => {
            this.responseFactory.createAndSendUnauthenticatedResponse();
          }).toThrow();
        });
      });

      describe("with failSilentlyOnUnsupportedFeatures = true", function() {
        it("does not throw an exception", function() {
          expect(() => {
            this.responseFactory.createAndSendUnauthenticatedResponse();
          }).not.toThrow();
        });
      });
    });

    describe("createAndSendEmptyResponse", function() {
      it("creates instance correctly", function() {
        expect(this.responseFactory.createAndSendEmptyResponse().constructor).toEqual(EmptyResponse);
      });

      it("sends an empty response", function() {
        this.sent = false;
        this.handler = {...this.handler,  sendResponse: () => (this.sent = true)};
        this.responseFactory.handler = this.handler;

        this.responseFactory.createAndSendEmptyResponse();
        expect(this.sent).toBeTruthy();
      });
    });
  });

  describe("with handler as SSML enabled handler", function() {
    beforeEach(function() {
      this.handler = {...this.handler,  isSSML: false};
      this.responseFactory.handler = this.handler;
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
    });
  });

  describe("with handler as chat messages enabled handler", function() {
    beforeEach(function() {
      this.handler = {...this.handler,  chatBubbles: null};
      this.responseFactory.handler = this.handler;
    });

    describe("createChatResponse", function() {
      it("creates instance correclty", function() {
        expect(this.responseFactory.createChatResponse().constructor).toEqual(ChatResponse);
      });
    });
  });

  describe("with handler as suggestion chips enabled handler", function() {
    beforeEach(function() {
      this.handler = {...this.handler,  suggestionChips: null};
      this.responseFactory.handler = this.handler;
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
      this.handler = {...this.handler, 
        sendResponse: () => (this.sent = true),
        forceAuthenticated: false};
      this.responseFactory.handler = this.handler;
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
