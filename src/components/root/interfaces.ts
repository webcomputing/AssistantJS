import Logger = require("bunyan");

export { Logger };

export const componentInterfaces = {
  "contextDeriver": Symbol("request-handler"),
  "afterContextExtension": Symbol("after-context-extension"),
  "generator": Symbol("generator")
};

export interface RequestContext {
  id: string;
  method: string;
  path: string;
  body: any;
  headers: { [name: string]: string | string[] }
  responseCallback: ResponseCallback;
}

export interface ResponseCallback {
  (body: string, headers?: { [name: string]: string | string[] }, statusCode?: number);
}

export interface ContextDeriver {
  derive(context: RequestContext): Promise<[any, string] | undefined>;
}

export interface GeneratorExtension {
  execute(buildPath: string): void;
}


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

/** Configuration object for AssistantJS user for root component */
export interface Configuration extends Partial<Configuration.Defaults>, Configuration.Required {}