import { Configuration } from "./private-interfaces";

type Without<T, U extends string> = { [P in Exclude<keyof T, U>]: never };
export type TranslationLeaf<Platforms extends string> = string | string[] | { [platform in Platforms]: string | string[] };
export type TranslationKeys<T extends {}, Platforms extends string> = {
  [k in keyof Without<T, Platforms>]: T[k] extends TranslationLeaf<Platforms> ? string : TranslationKeys<T[k], Platforms>
};

/** Uses I18next to get translations for keys */
export interface TranslateHelper<Platforms extends string = never, Autocompletion extends {} = {}> {
  /**
   * Access translations as "pathed" in translation files. Final element, which is called leaf, is a function
   * working in the same way as `t()`, but on the path already given.
   */
  tk(): TranslationKeys<Autocompletion, Platforms>;

  /**
   * Translates the given key using your json translations and a convention-over-configuration-approach.
   * First try is `currentState.currentIntent.platform.device`.
   * @param locals If given: variables to use in response
   */
  t(locals?: { [name: string]: string | number | object }): Promise<string>;

  /**
   * Translates the given key using your json translations.
   * @param key String of the key to look for. If you pass a relative key (beginning with '.'),
   * this method will apply several conventions, first looking for a translation for "currentState.currentIntent.KEY.platform.device".
   * If you pass an absolute key (without "." at beginning), this method will look at given absolute key.
   * @param locals Variables to use in reponse
   */
  t(key?: string, locals?: { [name: string]: string | number | object }): Promise<string>;
}

export interface InterpolationResolver {
  /**
   * resolves all missing interpolations in the given translation iteratively by executing missingInterpolation extensions
   * @param translatedValue text containing missing interpolations
   */
  resolveMissingInterpolations(translatedValue: string, translateHelper: TranslateHelper): Promise<string>;
}

export type TranslateValuesFor = (key: string, options?: any) => Promise<string[]>;

/** Configuration object for AssistantJS user for i18n component */
// tslint:disable-next-line:interface-name
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
  execute(missingInterpolationName: string, translateHelper: TranslateHelper): string | undefined | Promise<string | undefined>;
}
