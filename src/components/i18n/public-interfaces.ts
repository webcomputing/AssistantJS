import { Configuration } from "./private-interfaces";

/** Uses I18next to get translations for keys */
export interface TranslateHelper {
  /**
   * Translates the given key using your json translations and a convention-over-configuration-approach.
   * First try is `currentState.currentIntent.platform.device`.
   * @param locals If given: variables to use in response
   */
  t(locals?: { [name: string]: string | number | object }): string;

  /**
   * Translates the given key using your json translations.
   * @param key String of the key to look for. If you pass a relative key (beginning with '.'), 
    this method will apply several conventions, first looking for a translation for "currentState.currentIntent.KEY.platform.device". 
    If you pass an absolute key (without "." at beginning), this method will look at given absolute key.
   * @param locals Variables to use in reponse
   */
  t(key?: string, locals?: { [name: string]: string | number | object }): string;
}

/**
 * Returns all translations for a given key, especially useful for specs
 * @param {string} key Key of the translation
 * @param {any} options Options to pass to i18next / translate helper
 * @return {string[]} All fitting translations
 */
export type TranslateValuesFor = (key: string, options?: any) => string[];

/** Configuration object for AssistantJS user for i18n component */
export interface I18nConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {}

/**
 * Extension which is used if an interpolation value is missing
 */
export interface MissingInterpolationExtension {
  /**
   * Returns either a string or undefined, wether or not you want to fill a missingInterpolation
   * If a string is returned, it will be used to fill the missing interpolation value
   * @param missingInterpolationName name of the interpolation that is missing
   */
  execute(missingInterpolationName: string): string | undefined;
}
