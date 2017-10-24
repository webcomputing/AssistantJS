import { injectable, inject } from "inversify";
import { Component } from "inversify-components";
import { ResponseFactory as ResponseFactoryInterface, MinimalResponseHandler, OptionalHandlerFeatures, Voiceable, Configuration } from "./interfaces";

import { BaseResponse } from "./responses/base-response";
import { EmptyResponse } from "./responses/empty-response";
import { SimpleVoiceResponse } from "./responses/simple-voice-response";
import { SSMLResponse } from "./responses/ssml-response";
import { UnauthenticatedResponse } from "./responses/unauthenticated-response";
import { VoiceResponse } from "./responses/voice-response";
import { CardResponse } from "./responses/card-response";
import { ChatResponse } from "./responses/chat-response";
import { SuggestionChipsResponse } from "./responses/suggestion-chips-response";

@injectable()
export class ResponseFactory implements ResponseFactoryInterface {
  /** If set to false, this response object will throw an exception if an unsupported feature if used */
  failSilentlyOnUnsupportedFeatures = true;

  /** Response handler of the currently used platform */
  handler: MinimalResponseHandler;

  constructor(
    @inject("core:unifier:current-response-handler") handler: MinimalResponseHandler,
    @inject("meta:component//core:unifier") componentMeta: Component
  ) {
    this.handler = handler;
    this.failSilentlyOnUnsupportedFeatures = (componentMeta.configuration as Configuration).failSilentlyOnUnsupportedFeatures as boolean;
  }

  createVoiceResponse() {
    let ssml: Voiceable;
    if (BaseResponse.featureIsAvailable(this.handler, OptionalHandlerFeatures.FeatureChecker.SSMLHandler)) {
      ssml = new SSMLResponse(this.handler, this.failSilentlyOnUnsupportedFeatures);
    } else {
      ssml = new SimpleVoiceResponse(this.handler, this.failSilentlyOnUnsupportedFeatures);
    }
    
    return new VoiceResponse(new SimpleVoiceResponse(this.handler, this.failSilentlyOnUnsupportedFeatures), ssml);
  }

  createSimpleVoiceResponse() {
    return new SimpleVoiceResponse(this.handler, this.failSilentlyOnUnsupportedFeatures);
  }

  createSSMLResponse() {
    return new SSMLResponse(this.handler, this.failSilentlyOnUnsupportedFeatures);
  }

  createSuggestionChipsResponse() {
    return new SuggestionChipsResponse(this.handler, this.failSilentlyOnUnsupportedFeatures);
  }

  createChatResponse() {
    return new ChatResponse(this.handler, this.failSilentlyOnUnsupportedFeatures);
  }

  createCardResponse() {
    return new CardResponse(this.handler, this.failSilentlyOnUnsupportedFeatures);
  }

  createAndSendEmptyResponse() {
    return new EmptyResponse(this.handler, this.failSilentlyOnUnsupportedFeatures);
  }

  createAndSendUnauthenticatedResponse(text: string = "") {
    return new UnauthenticatedResponse(this.handler, this.createVoiceResponse(), this.failSilentlyOnUnsupportedFeatures, text);
  }
}