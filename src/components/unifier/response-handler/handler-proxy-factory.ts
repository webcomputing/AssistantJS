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
        // return proxy in case there is no function with the specific name, properties MUST have the value null to get here ignored.
        if (typeof propValue === "undefined") {
          // return a fake function, which is automatically called
          return function() {
            // "this" points to the proxy, is like using the "receiver" that the proxy has captured
            return this;
          };
        }
        // only intercept method calls, not property access
        if (typeof propValue !== "function") {
          return propValue;
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
