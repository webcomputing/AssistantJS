/**
 * Express independent request handling.
 * You could also use this entry point without express at all.
 */
import { Container, ExecutableExtension } from "ioc-container";
import { injectable } from "inversify";
import { log } from "../../globals";

import { RequestContext, componentInterfaces } from "./interfaces";

@injectable()
export class GenericRequestHandler {

  /** 
   * Creates a DI child container and adds request context to it. 
   * After that, calls extensions registered @componentInterfaces.requestHandler
   */
  execute(context: RequestContext, container: Container) {
    log("Handling request with context = %O", context);

    // Create child container and append this request context to it
    let scopedRequestContainer = container.inversifyInstance.createChild();
    scopedRequestContainer.bind("current|core:root:request-context").toConstantValue(context);

    // Register this child container as request-scope and make context available in all descriptors
    container.componentRegistry.autobind(scopedRequestContainer, [], "request", context);

    // Load and execute registered request handlers - including our own handlers
    let extensions = scopedRequestContainer.getAll<ExecutableExtension>(componentInterfaces.requestHandler);
    extensions.forEach(extension => extension.execute());
  }
}