import Logger = require("bunyan");
import { Configuration } from "./private-interfaces";
import { Observer } from "rxjs";

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
  headers: { [name: string]: string | string[] };

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

export interface ComponentSpecificLoggerFactory {
  /**
   * Factory to build a component-specific logger
   * @param {string} componentName Name of current component
   * @param {'root'|'request'} scope If given, returned logger will live in the given dependency scope. If not given, detects used scope by availability; will prefer 'request' if available.
   * @return {Logger}
   */
  (componentName: string, scope?: "root" | "request"): Logger;
}

/** Interface to fulfill to add a new logger middleware / to add parameters to request-specific bunyan-instance */
export interface LoggerMiddleware {
  (loggerInstance: Logger): Logger;
}

/** Configuration object for AssistantJS user for root component */
export interface RootConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {}

/** Event, which can be send to EventBus */
export interface AssistantJSEvent {
  data: {
    type: string;
    value: any;
  };
  category?: string;
}

/** Handler-Extensions, which get notified when new channels are registered */
export interface EventHandler {
  getSubscriber(category: string, channel: string): Observer<AssistantJSEvent> | undefined;
}

/**
 * EventBus, on which it is possible to publish new events and to subscribe to channels
 * gets registered as global service
 */
export interface EventBus {
  /**
   * publishes new events to channel
   * @param event which gets published
   * @param channel to witch the event get published
   */
  publish(event: AssistantJSEvent, channel: string): void;

  /**
   * Allows subscription to a combination of channel and category
   * @param observer for  recieving events
   * @param channel channel on which ther event is transfered
   * @param category (optional) if not set the observe will be subscribed to a default category
   */
  subscribe(observer: Observer<AssistantJSEvent>, channel: string, category?: string): void;
}
