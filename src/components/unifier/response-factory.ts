import { injectable, inject } from "inversify";
import { ResponseFactory as ResponseFactoryInterface, MinimalRequestExtraction, OptionalHandlerFeatures, Voiceable } from "./interfaces";

import { BaseResponse } from "./responses/base-response";
import { EmptyResponse } from "./responses/empty-response";
import { SimpleVoiceResponse } from "./responses/simple-voice-response";
import { SSMLResponse } from "./responses/ssml-response";
import { UnauthenticatedResponse } from "./responses/unauthenticated-response";
import { VoiceResponse } from "./responses/voice-response";

@injectable()
export class ResponseFactory implements ResponseFactoryInterface {
  extraction: MinimalRequestExtraction;

  constructor(@inject("core:unifier:current-extraction") extraction: MinimalRequestExtraction) {
    this.extraction = extraction;
  }

  createVoiceResponse() {
    let ssml: Voiceable;
    if (BaseResponse.featureIsAvailable(this.extraction.getHandler(), OptionalHandlerFeatures.FeatureChecker.SSMLHandler)) {
      ssml = new SSMLResponse(this.extraction);
    } else {
      ssml = new SimpleVoiceResponse(this.extraction);
    }
    
    return new VoiceResponse(this.extraction, new SimpleVoiceResponse(this.extraction), ssml);
  }

  createSimpleVoiceResponse() {
    return new SimpleVoiceResponse(this.extraction);
  }

  createSSMLResponse() {
    return new SSMLResponse(this.extraction);
  }

  createAndSendEmptyResponse() {
    return new EmptyResponse(this.extraction);
  }

  createAndSendUnauthenticatedResponse(text: string = "") {
    return new UnauthenticatedResponse(this.extraction, this.createVoiceResponse(), text);
  }
}