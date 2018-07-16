import { inject, injectable, targetName } from "inversify";
import { Component } from "inversify-components";
import { injectionNames } from "../../../injection-names";
import { Logger } from "../../root/public-interfaces";
import { Configuration } from "../private-interfaces";
import { BasicHandler } from "./basic-handler";
import { BasicAnswerTypes, BasicHandable } from "./handler-types";

@injectable()
export class HandlerProxyFactory {
  /**
   * If set to false, this the handler will throw an exception if an unsupported feature if used
   */
  private failSilentlyOnUnsupportedFeatures: boolean = true;

  constructor(@inject(injectionNames.logger) private logger: Logger, @inject("meta:component//core:unifier") componentMeta: Component<Configuration.Runtime>) {
    this.failSilentlyOnUnsupportedFeatures = componentMeta.configuration.failSilentlyOnUnsupportedFeatures;
  }

  /**
   * All empty properties in the Handler MUST have the value 'null', as undefined is used to proxy for unknown functions
   * @param handler
   */
  public createHandlerProxy<K extends BasicAnswerTypes, T extends BasicHandable<K>>(handler: T): T {
    const failSilentlyOnUnsupportedFeatures = this.failSilentlyOnUnsupportedFeatures;
    const logger = this.logger;

    const proxiedHandler = new Proxy(handler, {
      get(target, propKey, receiver) {
        const propValue = target[propKey];

        const handlerName = handler.constructor.name;

        const fakeFunction = function() {
          // "this" points to the proxy, is necessary to work with method-chaining
          return this;
        };

        // return proxy in case there is no function with the specific name, optional properties MUST have the value null to get here ignored.
        if (typeof propValue === "undefined") {
          logger.warn("Method " + propKey.toString() + "() is not implemented on " + handlerName);

          // return a fake function, which is automatically called
          return fakeFunction;
        }

        // only intercept method calls, not property access
        if (typeof propValue !== "function") {
          return propValue;
        }

        if (
          !(
            handler.whitelist.indexOf(propKey.toString() as any) > -1 || // in general whitelist
            handler.specificWhitelist.indexOf(propKey.toString() as any) > -1 || // in handler specific whitelist
            propKey // or by convention with name
              .toString()
              .toLowerCase()
              .startsWith("set" + handlerName.toLowerCase())
          )
        ) {
          const message = "Method " + propKey.toString() + "() is not supported on " + handlerName;
          logger.warn(message);
          if (!failSilentlyOnUnsupportedFeatures) {
            throw new Error(message);
          }

          return fakeFunction;
        }

        return function() {
          // "this" points to the proxy, is necessary to work with method-chaining
          return propValue.apply(this, arguments);
        };
      },

      set(target, propertyKey, value, receiver): boolean {
        if (typeof target[propertyKey] !== "function") {
          target[propertyKey] = value;
          return true;
        }

        return false;
      },
    });

    return proxiedHandler;
  }
}
