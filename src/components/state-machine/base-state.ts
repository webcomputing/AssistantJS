import { injectable, unmanaged } from "inversify";
import { TranslateHelper } from "../i18n/public-interfaces";
import { Logger, RequestContext } from "../root/public-interfaces";
import { featureIsAvailable } from "../unifier/feature-checker";
import { MinimalRequestExtraction, OptionalExtractions, ResponseFactory, Voiceable } from "../unifier/public-interfaces";
import { State, Transitionable } from "./public-interfaces";

/**
 * BaseState
 * Abstract base state covering all needed intent methods described by the State interface + some nice helper methods to get platform or device.
 * You can use this state as your base class, just make your ApplicationState inherit from it.
 */

@injectable()
export abstract class BaseState implements State.Required, Voiceable, TranslateHelper {
  /** Current response factory */
  public responseFactory: ResponseFactory;

  /** Current translate helper */
  public translateHelper: TranslateHelper;

  /** Current extracion result */
  public extraction: MinimalRequestExtraction;

  /** Current request-specific logger */
  public logger: Logger;

  /**
   *
   * @param {ResponseFactory} responseFactory Current response factory
   * @param {TranslateHelper} translateHelper Current translate helper
   * @param {MinimalRequestExtraction} extraction Extraction of current request
   * @param {Logger} logger Logger, prepared to log information about the current request
   */
  constructor(responseFactory: ResponseFactory, translateHelper: TranslateHelper, extraction: MinimalRequestExtraction, logger: Logger);

  /**
   * As an alternative to passing all objects on it's own, you can also pass a set of them
   * @param {StateSetupSet} stateSetupSet A set containing response factory, translate helper and extraction.
   */
  constructor(stateSetupSet: State.SetupSet);

  constructor(
    @unmanaged() responseFactoryOrSet: ResponseFactory | State.SetupSet,
    @unmanaged() translateHelper?: TranslateHelper,
    @unmanaged() extraction?: MinimalRequestExtraction,
    @unmanaged() logger?: Logger
  ) {
    if (typeof (responseFactoryOrSet as State.SetupSet).responseFactory === "undefined") {
      // Did not pass StateSetupSet
      if (typeof translateHelper === "undefined" || typeof extraction === "undefined" || typeof logger === "undefined") {
        throw new Error("If you pass a ResponseFactory as first parameter, you also have to pass translateHelper, extraction and logger.");
      }

      this.responseFactory = responseFactoryOrSet as ResponseFactory;
      this.translateHelper = translateHelper;
      this.extraction = extraction;
      this.logger = logger;
    } else {
      // Did pass StateSetupSet
      if (typeof translateHelper !== "undefined" || typeof extraction !== "undefined" || typeof logger !== "undefined") {
        throw new Error("If you pass a StateSetupSet as first parameter, you cannot pass either translateHelper, extraction or logger.");
      }

      this.responseFactory = (responseFactoryOrSet as State.SetupSet).responseFactory;
      this.translateHelper = (responseFactoryOrSet as State.SetupSet).translateHelper;
      this.extraction = (responseFactoryOrSet as State.SetupSet).extraction;
      this.logger = (responseFactoryOrSet as State.SetupSet).logger;
    }
  }

  /** Prompts with current unhandled message */
  public unhandledGenericIntent(machine: Transitionable, originalIntentMethod: string, ...args: any[]): any {
    this.responseFactory.createVoiceResponse().prompt(this.translateHelper.t());
  }

  /** Sends empty response */
  public unansweredGenericIntent(machine: Transitionable, ...args: any[]): any {
    this.responseFactory.createAndSendEmptyResponse();
  }

  /**
   * Translates the given key using your json translations and a convention-over-configuration-approach.
   * First try is `currentState.currentIntent.platform.device`.
   * @param locals If given: variables to use in response
   */
  public t(locals?: { [name: string]: string | number | object }): string;

  /**
   * Translates the given key using your json translations.
   * @param key String of the key to look for. If you pass a relative key (beginning with '.'), this method will apply several conventions.
   * First of them, this method will for a translation for "currentState.currentIntent.KEY.platform.device".
   * If you pass an absolute key (without "." at beginning), this method will look at given absolute key.
   * @param locals Variables to use in reponse
   */
  public t(key?: string, locals?: { [name: string]: string | number | object }): string;

  public t(...args: any[]) {
    return (this.translateHelper as any).t(...args);
  }

  /**
   * Sends voice message but does not end session, so the user is able to respond
   * @param {string} text Text to say to user
   * @param {string[]} [reprompts] If the user does not answer in a given time, these reprompt messages will be used.
   */
  public prompt(text: string, ...reprompts: string[]) {
    return this.responseFactory.createVoiceResponse().prompt(text, ...reprompts);
  }

  /**
   * Sends voice message and ends session
   * @param {string} text Text to say to user
   */
  public endSessionWith(text: string) {
    return this.responseFactory.createVoiceResponse().endSessionWith(text);
  }

  /** Returns name of current platform */
  public getPlatform(): string {
    return this.extraction.platform;
  }

  /** Returns name of current device. If the current platform does not support different devices, returns name of current platform. */
  public getDeviceOrPlatform(): string {
    if (featureIsAvailable<OptionalExtractions.Device>(this.extraction, OptionalExtractions.FeatureChecker.DeviceExtraction)) {
      return this.extraction.device;
    }
    return this.getPlatform();
  }
}
