import { inject, injectable, targetName } from "inversify";
import { Component } from "inversify-components";
import { injectionNames } from "../../../injection-names";
import { Logger } from "../../root/public-interfaces";
import { Configuration } from "../private-interfaces";
import { BasicAnswerTypes, BasicHandable } from "./handler-types";

/**
 * This Factory adds a proxy arround the current handler to allow method-chaining with every specific handler,
 * even when the specific handler does not have an impleementation for the specific method.
 *
 *
 * This factory is bound to the root-scope as singleton, so DO NOT add any injections with request-scope here
 */
@injectable()
export class HandlerProxyFactory {
  /**
   * If set to false, this the handler will throw an exception if an unsupported feature if used
   */
  private failSilentlyOnUnsupportedFeatures: boolean = true;

  /**
   * This factory is bound to the root-scope as singleton, so DO NOT add any injections with request-scope here
   * @param logger for logging warnings or errors
   * @param componentMeta with configuration
   */
  constructor(@inject(injectionNames.logger) private logger: Logger, @inject(injectionNames.unifierComponent) componentMeta: Component<Configuration.Runtime>) {
    this.failSilentlyOnUnsupportedFeatures = componentMeta.configuration.failSilentlyOnUnsupportedFeatures;
  }

  /**
   * All empty properties in the Handler MUST have the value 'null', as undefined is used to proxy for unknown functions
   *
   * This factory is bound to the root-scope as singleton, so DO NOT add any injections with request-scope here
   * @param handler
   */
  public createHandlerProxy<K extends BasicAnswerTypes, T extends BasicHandable<K>>(handler: T): T {
    const failSilentlyOnUnsupportedFeatures = this.failSilentlyOnUnsupportedFeatures;
    const logger = this.logger;

    const getAllPropertyNames = obj => {
      let current = obj;
      const props = new Set();
      do {
        Object.getOwnPropertyNames(current).forEach(p => props.add(p));
        current = Object.getPrototypeOf(current);
      } while (current && current !== Object.getPrototypeOf({}));
      return Array.from(props);
    };

    const proxiedHandler = new Proxy(handler, {
      /**
       * Trap for all get call.
       * @param target current handler
       * @param propKey to get
       * @param receiver, the current proxy object
       */
      get(target, propKey, receiver) {
        const propValue = target[propKey];

        // return proxy in case there is no function with the specific name, optional properties MUST have the value null to get ignored here.
        // we exclude then and catch, so that this handler does not look like a Promise
        if (
          typeof propValue === "undefined" &&
          propKey.toString() !== "then" &&
          propKey.toString() !== "catch" &&
          propKey.toString() !== "Symbol(util.inspect.custom)" &&
          propKey.toString() !== "Symbol(Symbol.iterator)" &&
          propKey.toString() !== "Symbol(Symbol.toStringTag)"
        ) {
          const message = "Method " + propKey.toString() + "() is not implemented or supported on the current ResponseHandler.";
          if (!failSilentlyOnUnsupportedFeatures) {
            throw new Error(`${message} Exiting due to configuration of failSilentlyOnUnsupportedFeatures.`);
          } else {
            // We return a fake function which enables method chaining by returning this proxy, logs the unsupported feature call and calls responseHandler.onUnsupportedFeature
            return function() {
              logger.debug(message);

              // "receiver" points to the proxy, we have to pass it as this context for responseHandler to enable correct method chaining
              target.onUnsupportedFeature.apply(receiver, [propKey, ...arguments]);

              return receiver;
            };
          }
        }

        // only intercept method calls, not property access
        if (typeof propValue !== "function") {
          return propValue;
        }

        return function() {
          // "receiver" points to the proxy, we have to pass it as this context for responseHandler to enable correct method chaining
          return propValue.apply(receiver, arguments);
        };
      },

      /**
       * trap for setting values, alows iny to set properties, does not allow to overrwrite functions
       * @param target the current handler
       * @param propertyKey the key whoch should get set
       * @param value to set
       * @param receiver
       */
      set(target, propertyKey, value, receiver): boolean {
        if (typeof target[propertyKey] !== "function") {
          target[propertyKey] = value;
          return true;
        }

        return false;
      },

      /**
       * This traps Object.keys() or Object.getPropertyNames()
       * @param target the current handler
       */
      ownKeys(target) {
        const props = getAllPropertyNames(target);

        return props;
      },

      /**
       * This is necessary so that Object.keys is traped by ownKeys()
       * @param target the current handler
       */
      getOwnPropertyDescriptor(target) {
        return {
          enumerable: true,
          configurable: true,
        };
      },
    });

    return proxiedHandler;
  }
}
