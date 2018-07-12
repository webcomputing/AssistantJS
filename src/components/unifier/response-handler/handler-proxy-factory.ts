import { BasicHandler } from "./basic-handler";
import { BasicAnswerTypes } from "./handler-types";

export class HandlerProxyFactory {
  /**
   * All empty properties in the Handler MUST have the value 'null', as undefined is used to proxy for unknown functions
   * @param handler
   */
  public static createHandlerProxy<K extends BasicAnswerTypes, T extends BasicHandler<K>>(handler: T): T {
    const proxiedHandler = new Proxy(handler, {
      get(target, propKey, receiver) {
        const propValue = target[propKey];

        const handlerName = handler.constructor.name;

        const fakeFunction = function() {
          // "this" points to the proxy, is like using the "receiver" that the proxy has captured
          return this;
        };

        // return proxy in case there is no function with the specific name, optional properties MUST have the value null to get here ignored.
        if (typeof propValue === "undefined") {
          console.log("Method " + propKey.toString() + "() is not implemented on " + handlerName); // todo: exchange with correct logger

          // return a fake function, which is automatically called
          return fakeFunction;
        }

        // only intercept method calls, not property access
        if (typeof propValue !== "function") {
          return propValue;
        }

        if (
          !(
            handler.whitelist.indexOf(propKey.toString() as any) > 0 ||
            handler.specificWhitelist.indexOf(propKey.toString() as any) > 0 ||
            propKey
              .toString()
              .toLowerCase()
              .startsWith("set" + handlerName.toLowerCase())
          )
        ) {
          console.log("Method " + propKey.toString() + "() is not supported on " + handlerName); // todo: exchange with correct logger and add Error here, when required

          // return a fake function, which is automatically called
          return fakeFunction;
        }

        return function() {
          // "this" points to the proxy, is like using the "receiver" that the proxy has captured
          return propValue.apply(this, arguments);
        };
      },
    });

    return proxiedHandler;
  }
}
