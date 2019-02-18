import Logger = require("bunyan");
import { Observable, Observer } from "rxjs";
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

/**
 * Factory to build a component-specific logger
 * @param {string} componentName Name of current component
 * @param {'root'|'request'} scope If given, returned logger will live in the given dependency scope. If not given, detects used scope by availability; will prefer 'request' if available.
 * @return {Logger}
 */
export type ComponentSpecificLoggerFactory = (componentName: string, scope?: "root" | "request") => Logger;

/** Interface to fulfill to add a new logger middleware / to add parameters to request-specific bunyan-instance */
export type LoggerMiddleware = (loggerInstance: Logger) => Logger;

/** Configuration object for AssistantJS user for root component */
export interface RootConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {}

/** Event, which can be send to EventBus */
export interface AssistantJSEvent<DataType = any> {
  /** Identification of event. If you want to emit events of an AssistantJS component, you possibly want to import it's symbol. */
  name: symbol | string;

  /** Additional data you might want (or need) to add to your event */
  data?: DataType;
}

/** Handler-Extensions, which get notified when new channels are registered */
export interface EventHandler<EventDataType = any> {
  /** If you want to subscribe to this event, you have to return an observer for it. Else return undefined. */
  getSubscriber(eventName: symbol | string): Observer<AssistantJSEvent<EventDataType>> | undefined;
}

/**
 * EventBus, on which it is possible to publish and subscribe to AssistantJSEvents.
 * Gets registered as global service ("root:event-bus").
 */
export interface EventBus {
  /**
   * Gets an observable of a given eventName
   * @param {string|symbol} eventName to get an observable of
   * @return {Observable<AssistantJSEvent>} observable for this AssistantJSEvent
   */
  getObservable(eventName: string | symbol): Observable<AssistantJSEvent>;

  /**
   * Publishes an event
   * @param {AssistantJSEvent<DataType>} event which gets published
   */
  publish(event: AssistantJSEvent): void;

  /**
   * Subscribes a given observer to an event name
   * @param {string|symbol} eventName to subscribe to
   * @param {Observer<AssistantJSEvent<DataType>>} observer to subscribe
   */
  subscribe(eventName: string | symbol, observer: Observer<AssistantJSEvent>): void;
}
