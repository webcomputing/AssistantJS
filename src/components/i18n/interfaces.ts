import * as i18next from "i18next";

export interface TranslateHelper {
  /**
   * Translates the given key using your json translations.
   * @param key optional string. If you leave out this param, will look at key called "currentState.currentIntent". If you pass a 
   * relative key (beginning with '.'), will look at "currentState.currentIntent.KEY". If you pass an absolute key (without "." at beginning), 
   * looks at given absolute key.
   * @param locals Variables to use in resonses
   */
  t(locals?: {[name: string]: string}): string;
  t(key?: string, locals?: {[name: string]: string}): string;
}

export interface Configuration {
  /** A valid instance of i18next needed */
  i18nextInstance: i18next.I18n;
  /** 
   * Additional options to configure with i18next. 
   * This MUST contain a backend-path in backend: {loadPath: ...}!
   * See i18next for more details.
   */
  i18nextAdditionalConfiguration: any;
}