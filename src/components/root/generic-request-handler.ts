/**
 * Express independent request handling.
 * You could also use this entry point without express at all.
 */
import { Container, ExecutableExtension } from "ioc-container";
import { injectable, interfaces as inversifyInterfaces } from "inversify";
import { log } from "../../globals";

import { RequestContext, ContextDeriver, componentInterfaces } from "./interfaces";

@injectable()
export class GenericRequestHandler {

  /** 
   * Creates a DI child container and adds request context to it. 
   * After that, calls extensions registered @componentInterfaces.requestHandler
   */
  async execute(context: RequestContext, container: Container) {
    log("Handling request with context = %O", context);

    // Create child container and append this request context to it
    let scopedRequestContainer = this.createChildContainer(container);
    this.bindContextToContainer(context, scopedRequestContainer, "current|core:root:request-context");

    // Load and execute registered request handlers - including our own handlers.
    // Request handlers have the ability to add something to current di scope.
    let extensions = scopedRequestContainer.getAll<ContextDeriver>(componentInterfaces.contextDeriver);
    let results = await Promise.all(extensions.map(extension => extension.derive(context)));
    results.forEach(result => {
      if (typeof(result) !== "undefined") {
        this.bindContextToContainer(result[0], scopedRequestContainer, result[1]);
      }
    });

    // Register this child container as request-scope and make context available in all descriptors
    container.componentRegistry.autobind(scopedRequestContainer, [], "request", context);

    // Execute additional extensions, including our state machine
    let additionalExtensions = scopedRequestContainer.getAll<ExecutableExtension>(componentInterfaces.afterContextExtension);
    additionalExtensions.forEach(e => e.execute());
  }

  /** Binds a constant object to a given container */
  bindContextToContainer(context: any, container: inversifyInterfaces.Container, name: string) {
    log(`Binding context to ${name}...`);
    container.bind(name).toConstantValue(context);
  }

  createChildContainer(container: Container): inversifyInterfaces.Container {
    return container.inversifyInstance.createChild();
  }
}