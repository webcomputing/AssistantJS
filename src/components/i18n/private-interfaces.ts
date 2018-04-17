import * as i18next from "i18next";

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
  export interface Runtime extends Defaults, Required {}
}
