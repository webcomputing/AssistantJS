import { Logger } from "./public-interfaces";

export const componentInterfaces = {
  "contextDeriver": Symbol("request-handler"),
  "afterContextExtension": Symbol("after-context-extension"),
  "generator": Symbol("generator"),
  "loggerMiddleware": Symbol("logger-middleware"),
};

export namespace Configuration {
  /** Configuration defaults -> all of these keys are optional for user */
  export interface Defaults {
    /**
     * Instance of bunyan logger.
     * If you want to use your own bunyan logger as root logger, pass it here.
     * You will have access to request-dependent child instances of this logger in your states.
     */
    bunyanInstance: Logger
  }

  /** Required configuration options, no defaults are used here */
  export interface Required {}

  /** Available configuration settings in a runtime application */
  export interface Runtime extends Defaults, Required {};
}
