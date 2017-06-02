import { ContainerImpl } from "ioc-container";

import { setupContainer, autobindContainer } from "../../../src/setup";
import { GenericRequestHandler } from "../../../src/components/root/generic-request-handler";
import { ChildlessGenericRequestHandler } from "../mocks/root/childless-generic-request-handler";

export function spawnContainer(autoSetup = true, autoBind = true, useChilds = false) {
  let container = new ContainerImpl();
  if (autoSetup) setupContainer(container);
  if (autoBind) autobindContainer(container);
  if (!useChilds) bindChildlessRequestHandlerMock(container);

  return container;
}

export function bindChildlessRequestHandlerMock(container: ContainerImpl) {
  container.inversifyInstance.unbind(GenericRequestHandler);
  container.inversifyInstance.bind(GenericRequestHandler).to(ChildlessGenericRequestHandler);
}