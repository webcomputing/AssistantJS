/**
 * Express independent request handling.
 * You could also use this entry point without express at all.
 */
import { injectable, interfaces as inversifyInterfaces } from "inversify";
import { Container, ExecutableExtension } from "inversify-components";

import { AfterContextExtension } from "../state-machine/public-interfaces";
import { componentInterfaces } from "./private-interfaces";
import { ContextDeriver, RequestContext } from "./public-interfaces";

@injectable()
export class GenericRequestHandler {
  /**
   * Creates a DI child container and adds request context to it.
   * After that, calls extensions registered @componentInterfaces.requestHandler
   */
  public async execute(context: RequestContext, container: Container) {
    // If you change any bindings here, also change spec_setup!

    // Create child container and append this request context to it
    const scopedRequestContainer = this.createChildContainer(container);
    this.bindContextToContainer(context, scopedRequestContainer, "core:root:current-request-context");

    // Load and execute registered request handlers - including our own handlers.
    // Request handlers have the ability to add something to current di scope.
    const extensions = scopedRequestContainer.getAll<ContextDeriver>(componentInterfaces.contextDeriver);
    const results = await Promise.all(extensions.map(extension => extension.derive(context)));
    const canBeHandled = results
      // returning true, when a result has been returned by the ContextDeriver, otherwise false
      .map(result => {
        if (typeof result !== "undefined") {
          this.bindContextToContainer(result[0], scopedRequestContainer, result[1], true);
          return true;
        }
        return false;
      })
      // reducing all results of the (multiple) ContextDeriver to one boolean
      .reduce((previousValue, currentValue) => {
        return previousValue || currentValue;
      }, false);

    // open the request scope only when the request can be handled
    if (canBeHandled) {
      // Register this child container as request-scope and make context available in all descriptors
      container.componentRegistry.autobind(scopedRequestContainer, [], "request", context);

      // Execute additional extensions, including our state machine
      const additionalExtensions = await Promise.all(scopedRequestContainer.getAll<AfterContextExtension>(componentInterfaces.afterContextExtension));
      additionalExtensions.forEach(e => e.execute());
    }
  }

  /** Binds a constant object to a given container */
  public bindContextToContainer(context: any, container: inversifyInterfaces.Container, name: string, asDynamicValue = false) {
    asDynamicValue ? container.bind(name).toDynamicValue(c => JSON.parse(JSON.stringify(context))) : container.bind(name).toConstantValue(context);
  }

  public createChildContainer(container: Container): inversifyInterfaces.Container {
    return container.inversifyInstance.createChild();
  }
}
