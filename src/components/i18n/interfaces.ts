import * as i18next from "i18next";

export interface TranslateHelper {
  /**
   * Translates the given key using your json translations and a convention-over-configuration-approach.
   * First try is `currentState.currentIntent.platform.device`.
   * @param locals If given: variables to use in response
   */
  t(locals?: {[name: string]: string | number | object}): string;

    /**
   * Translates the given key using your json translations.
   * @param key String of the key to look for. If you pass a relative key (beginning with '.'), 
    this method will apply several conventions, first looking for a translation for "currentState.currentIntent.KEY.platform.device". 
    If you pass an absolute key (without "." at beginning), this method will look at given absolute key.
   * @param locals Variables to use in reponse
   */
  t(key?: string, locals?: {[name: string]: string | number | object}): string;
}

export interface TranslateValuesFor {
  (key: string, options?: any): string[];
}

export namespace Configuration {
  /** Configuration defaults -> all of these keys are optional for user */
  export interface Defaults {
    /** A valid instance of i18next needed */
    i18nextInstance: i18next.I18n;
    /** 
     * Additional options to configure with i18next. 
     * This MUST contain a backend-path in backend: {loadPath: ...}!
     * See i18next for more details.
     */
    i18nextAdditionalConfiguration: any;
  }

  /** Required configuration options, no defaults are used here */
  export interface Required {}

  /** Available configuration settings in a runtime application */
  export interface Runtime extends Defaults, Required {};
}

/** Configuration object for AssistantJS user for i18n component */
export interface Configuration extends Partial<Configuration.Defaults>, Configuration.Required {}