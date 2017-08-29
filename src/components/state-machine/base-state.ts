import { injectable, unmanaged } from "inversify";
import { ResponseFactory } from "../unifier/interfaces";
import { TranslateHelper } from "../i18n/interfaces";
import { State } from "./interfaces";

/**
 * BaseState
 * Abstract base state covering all needed intent methods described by the State interface.
 * You can use this state as your base class, just make your ApplicationState inherit from it.
 */

@injectable()
export abstract class BaseState implements State {
  responseFactory: ResponseFactory;
  translateHelper: TranslateHelper;

  constructor(@unmanaged() responseFactory: ResponseFactory, @unmanaged() translateHelper: TranslateHelper) {
    this.responseFactory = responseFactory;
    this.translateHelper = translateHelper;
  }

  /** Prompts with current unhandled message */
  unhandledGenericIntent() {
    this.responseFactory.createVoiceResponse().prompt(this.translateHelper.t());
  }

  /** Sends empty response */
  unansweredGenericIntent() {
    this.responseFactory.createAndSendEmptyResponse();
  }
}