/** 
 * This is an implementation of GenericRequestHandle which DOES NOT spawn a child container,
 * but uses the parent container instead. Nice for testing.
 */

import { GenericRequestHandler } from "../../../../src/components/root/generic-request-handler";

export class ChildlessGenericRequestHandler extends GenericRequestHandler {
  createChildContainer(container) {
    return container.inversifyInstance;
  }
}