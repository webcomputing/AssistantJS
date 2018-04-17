import { inject, injectable } from "inversify";
import { Component } from "inversify-components";

import { injectionNames } from "../../injection-names";
import { Logger } from "../root/public-interfaces";
import { Configuration } from "./private-interfaces";
import { MinimalResponseHandler, OptionalHandlerFeatures, ResponseFactory as ResponseFactoryInterface, Voiceable } from "./public-interfaces";

import { BaseResponse } from "./responses/base-response";
import { CardResponse } from "./responses/card-response";
import { ChatResponse } from "./responses/chat-response";
import { EmptyResponse } from "./responses/empty-response";
import { SimpleVoiceResponse } from "./responses/simple-voice-response";
import { SSMLResponse } from "./responses/ssml-response";
import { SuggestionChipsResponse } from "./responses/suggestion-chips-response";
import { UnauthenticatedResponse } from "./responses/unauthenticated-response";
import { VoiceResponse } from "./responses/voice-response";

@injectable()
export class ResponseFactory implements ResponseFactoryInterface {
  /** If set to false, this response object will throw an exception if an unsupported feature if used */
  public failSilentlyOnUnsupportedFeatures = true;

  /** Response handler of the currently used platform */
  public handler: MinimalResponseHandler;

  /** Current logger instance */
  public logger: Logger;

  constructor(
    @inject("core:unifier:current-response-handler") handler: MinimalResponseHandler,
    @inject("meta:component//core:unifier") componentMeta: Component<Configuration.Runtime>,
    @inject(injectionNames.current.logger) logger: Logger
  ) {
    this.handler = handler;
    this.logger = logger;
    this.failSilentlyOnUnsupportedFeatures = componentMeta.configuration.failSilentlyOnUnsupportedFeatures;
  }

  public createVoiceResponse() {
    let ssml: Voiceable;
    if (
      BaseResponse.featureIsAvailable<OptionalHandlerFeatures.SSML & MinimalResponseHandler>(this.handler, OptionalHandlerFeatures.FeatureChecker.SSMLHandler)
    ) {
      ssml = new SSMLResponse(this.handler, this.failSilentlyOnUnsupportedFeatures, this.logger);
    } else {
      ssml = new SimpleVoiceResponse(this.handler, this.failSilentlyOnUnsupportedFeatures, this.logger);
    }

    return new VoiceResponse(new SimpleVoiceResponse(this.handler, this.failSilentlyOnUnsupportedFeatures, this.logger), ssml);
  }

  public createSimpleVoiceResponse() {
    return new SimpleVoiceResponse(this.handler, this.failSilentlyOnUnsupportedFeatures, this.logger);
  }

  public createSSMLResponse() {
    return new SSMLResponse(this.handler, this.failSilentlyOnUnsupportedFeatures, this.logger);
  }

  public createSuggestionChipsResponse() {
    return new SuggestionChipsResponse(this.handler, this.failSilentlyOnUnsupportedFeatures, this.logger);
  }

  public createChatResponse() {
    return new ChatResponse(this.handler, this.failSilentlyOnUnsupportedFeatures, this.logger);
  }

  public createCardResponse() {
    return new CardResponse(this.handler, this.failSilentlyOnUnsupportedFeatures, this.logger);
  }

  public createAndSendEmptyResponse() {
    return new EmptyResponse(this.handler, this.failSilentlyOnUnsupportedFeatures, this.logger);
  }

  public createAndSendUnauthenticatedResponse(text: string = "") {
    return new UnauthenticatedResponse(this.handler, this.createVoiceResponse(), this.failSilentlyOnUnsupportedFeatures, this.logger, text);
  }
}
