/**
 * Express independent request handling.
 * You could also use this entry point without express at all.
 */
import { Container, ExecutableExtension } from "inversify-components";
import { injectable, interfaces as inversifyInterfaces } from "inversify";

import { RequestContext, ContextDeriver } from "./public-interfaces";
import { componentInterfaces } from "./private-interfaces";

@injectable()
export class GenericRequestHandler {

  /** 
   * Creates a DI child container and adds request context to it. 
   * After that, calls extensions registered @componentInterfaces.requestHandler
   */
  async execute(context: RequestContext, container: Container) {
    // If you change any bindings here, also change spec_setup!

    // Create child container and append this request context to it
    let scopedRequestContainer = this.createChildContainer(container);
    this.bindContextToContainer(context, scopedRequestContainer, "core:root:current-request-context");

    // Load and execute registered request handlers - including our own handlers.
    // Request handlers have the ability to add something to current di scope.
    let extensions = scopedRequestContainer.getAll<ContextDeriver>(componentInterfaces.contextDeriver);
    let results = await Promise.all(extensions.map(extension => extension.derive(context)));
    results.forEach(result => {
      if (typeof(result) !== "undefined") {
        this.bindContextToContainer(result[0], scopedRequestContainer, result[1], true);
      }
    });

    // Register this child container as request-scope and make context available in all descriptors
    container.componentRegistry.autobind(scopedRequestContainer, [], "request", context);

    // Execute additional extensions, including our state machine
    let additionalExtensions = scopedRequestContainer.getAll<ExecutableExtension>(componentInterfaces.afterContextExtension);
    additionalExtensions.forEach(e => e.execute());
  }

  /** Binds a constant object to a given container */
  bindContextToContainer(context: any, container: inversifyInterfaces.Container, name: string, asDynamicValue = false) {
    asDynamicValue ? container.bind(name).toDynamicValue(c => JSON.parse(JSON.stringify(context))) : container.bind(name).toConstantValue(context);
  }

  createChildContainer(container: Container): inversifyInterfaces.Container {
    return container.inversifyInstance.createChild();
  }
}