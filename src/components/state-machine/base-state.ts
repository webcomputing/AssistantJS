import { injectable, unmanaged } from "inversify";
import { Voiceable, MinimalRequestExtraction,  ResponseFactory, OptionalExtractions } from '../unifier/interfaces';
import { featureIsAvailable } from '../unifier/feature-checker';
import { RequestContext, Logger } from '../root/interfaces';
import { TranslateHelper } from "../i18n/interfaces";
import { Transitionable } from "../state-machine/interfaces";
import { State, StateSetupSet } from "./interfaces";

/**
 * BaseState
 * Abstract base state covering all needed intent methods described by the State interface + some nice helper methods to get platform or device.
 * You can use this state as your base class, just make your ApplicationState inherit from it.
 */

@injectable()
export abstract class BaseState implements State.Required, Voiceable, TranslateHelper {

  /** Current response factory */
  responseFactory: ResponseFactory; 

  /** Current translate helper */
  translateHelper: TranslateHelper;

  /** Current extracion result */
  extraction: MinimalRequestExtraction; 

  /** Current request-dependent logger */
  logger: Logger;

  /**
   * 
   * @param {unifierInterfaces.ResponseFactory} responseFactory Current response factory
   * @param {i18nInterfaces.TranslateHelper} translateHelper Current translate helper
   * @param {unifierInterfaces.MinimalRequestExtraction} extraction Extraction of current request
   * @param {rootInterfaces.Logger} logger Logger, prepared to log information about the current request
   */
  constructor(
    responseFactory: ResponseFactory, 
    translateHelper: TranslateHelper, 
    extraction: MinimalRequestExtraction, 
    logger: Logger
  )

  /**
   * As an alternative to passing all objects on it's own, you can also pass a set of them
   * @param {stateMachineInterfaces.StateSetupSet} stateSetupSet A set containing response factory, translate helper and extraction.
   */
  constructor(stateSetupSet: StateSetupSet)

  constructor(
    @unmanaged() responseFactoryOrSet: ResponseFactory | StateSetupSet, 
    @unmanaged() translateHelper?: TranslateHelper, 
    @unmanaged() extraction?: MinimalRequestExtraction,
    @unmanaged() logger?: Logger
  ) {
    if (typeof (responseFactoryOrSet as StateSetupSet).responseFactory === "undefined") {
      // Did not pass StateSetupSet
      if (typeof translateHelper === "undefined" || typeof extraction === "undefined" || typeof logger === "undefined")
        throw new Error("If you pass a ResponseFactory as first parameter, you also have to pass translateHelper, extraction and logger.");
      
      this.responseFactory = responseFactoryOrSet as ResponseFactory;
      this.translateHelper = translateHelper;
      this.extraction = extraction;
      this.logger = logger;
    } else {
      // Did pass StateSetupSet
      if (typeof translateHelper !== "undefined" || typeof extraction !== "undefined" || typeof logger !== "undefined")
        throw new Error("If you pass a StateSetupSet as first parameter, you cannot pass either translateHelper, extraction or logger.");
      
      this.responseFactory = (responseFactoryOrSet as StateSetupSet).responseFactory;
      this.translateHelper = (responseFactoryOrSet as StateSetupSet).translateHelper;
      this.extraction = (responseFactoryOrSet as StateSetupSet).extraction;
      this.logger = (responseFactoryOrSet as StateSetupSet).logger;
    }
  }

  /** Returns name of current platform */
  getPlatform(): string {
    return this.extraction.platform;
  }

  /** Returns name of current device. If the current platform does not support different devices, returns name of current platform. */
  getDeviceOrPlatform(): string {
    if (featureIsAvailable(this.extraction, OptionalExtractions.FeatureChecker.DeviceExtraction)) {
      return (this.extraction as OptionalExtractions.DeviceExtraction).device;
    } else {
      return this.getPlatform();
    }
  }

  /** Synonym of translateHelper.t */
  t(...args: any[]) {
    return (this.translateHelper as any).t(...args);
  }

  /** Synonym of responseFactory.createVoiceResponse().prompt */
  prompt(text: string, ...reprompts: string[]) {
    this.responseFactory.createVoiceResponse().prompt(text, ...reprompts);
  }

  /** Synonym of responseFactory.createVoiceResponse().endSessionWith */
  endSessionWith(text: string) {
    this.responseFactory.createVoiceResponse().endSessionWith(text);
  }

  /** Prompts with current unhandled message */
  unhandledGenericIntent(machine: Transitionable, originalIntentMethod: string, ...args: any[]): any {
    this.responseFactory.createVoiceResponse().prompt(this.translateHelper.t());
  }

  /** Sends empty response */
  unansweredGenericIntent(machine: Transitionable, ...args: any[]): any {
    this.responseFactory.createAndSendEmptyResponse();
  }
}