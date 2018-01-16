import { ComponentDescriptor, Component } from "inversify-components";
import { GenericRequestHandler } from "./generic-request-handler";
import { defaultBunyan } from "./default-bunyan";
import { componentInterfaces, OptionalConfiguration, Configuration } from "./interfaces";

const defaultConfiguration: OptionalConfiguration = {
  bunyanInstance: defaultBunyan
}

export const descriptor: ComponentDescriptor = {
  name: "core:root",
  interfaces: componentInterfaces,
  defaultConfiguration: defaultConfiguration,
  bindings: {
    root: (bindService) => {
      bindService.bindLocalServiceToSelf(GenericRequestHandler);
      bindService.bindGlobalService("logger").toDynamicValue(context => {
        return (context.container.get<Component>("meta:component//core:root").configuration as any).bunyanInstance;
      });
    }
  }
};