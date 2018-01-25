import Logger = require("bunyan");
import { Configuration } from "./private-interfaces";

export { Logger };

/** Attributes / Context of a request */
export interface RequestContext {
  /** Unique ID of this request */
  id: string;

  /** HTTP method of this request */
  method: string;

  /** Requested path */
  path: string;

  /** Sent body */
  body: any;

  /** Headers of this request */
  headers: { [name: string]: string | string[] }

  /** Callback to trigger if you want to send a response */
  responseCallback: ResponseCallback;
}

/** Callback to trigger if you want to send the response of a request */
export interface ResponseCallback {
  /**
   * Callback to trigger if you want to send the response of a request
   * @param {string} body Body of response
   * @param {[name: string]: string | string[]} headers Headers of response
   * @param {number} statusCode Statuscode of response, defaults to 200
   */
  (body: string, headers?: { [name: string]: string | string[] }, statusCode?: number);
}

/** Interface you have to fulfill to register a context deriver (e. g. extract request information) */
export interface ContextDeriver {
  /**
   * Derives request information based on requestContext
   * @param {RequestContext} context context of request
   * @return {Promise<[any,string] | undefined>} Undefined if your deriver cannot derive anything, else the derived context and the di name to register this context to
   */
  derive(context: RequestContext): Promise<[any, string] | undefined>;
}

/** Interface to fulfill to register a generator (called via cli: "assistant g") */
export interface CLIGeneratorExtension {
  /** 
   * Called if user users cli "assistant g" command
   * @param {string} buildPath Path to build directory
   * @return {void|Promise<void>}
   */
  execute(buildPath: string): void | Promise<void>;
}

/** Configuration object for AssistantJS user for root component */
export interface RootConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {}