import { injectable, inject } from "inversify";
import { ResponseFactory as ResponseFactoryInterface, MinimalResponseHandler, OptionalHandlerFeatures, Voiceable } from "./interfaces";

import { BaseResponse } from "./responses/base-response";
import { EmptyResponse } from "./responses/empty-response";
import { SimpleVoiceResponse } from "./responses/simple-voice-response";
import { SSMLResponse } from "./responses/ssml-response";
import { UnauthenticatedResponse } from "./responses/unauthenticated-response";
import { VoiceResponse } from "./responses/voice-response";
import { CardResponse } from "./responses/card-response";

@injectable()
export class ResponseFactory implements ResponseFactoryInterface {
  handler: MinimalResponseHandler;

  constructor(@inject("core:unifier:current-response-handler") handler: MinimalResponseHandler) {
    this.handler = handler;
  }

  createVoiceResponse() {
    let ssml: Voiceable;
    if (BaseResponse.featureIsAvailable(this.handler, OptionalHandlerFeatures.FeatureChecker.SSMLHandler)) {
      ssml = new SSMLResponse(this.handler);
    } else {
      ssml = new SimpleVoiceResponse(this.handler);
    }
    
    return new VoiceResponse(this.handler, new SimpleVoiceResponse(this.handler), ssml);
  }

  createSimpleVoiceResponse() {
    return new SimpleVoiceResponse(this.handler);
  }

  createSSMLResponse() {
    return new SSMLResponse(this.handler);
  }

  createAndSendEmptyResponse() {
    return new EmptyResponse(this.handler);
  }

  createAndSendUnauthenticatedResponse(text: string = "") {
    return new UnauthenticatedResponse(this.handler, this.createVoiceResponse(), text);
  }

  createCardResponse() {
    return new CardResponse(this.handler);
  }
}