import { ComponentDescriptor, Component } from "inversify-components";
import { GenericRequestHandler } from "./generic-request-handler";
import { instance as winstonInstance } from "./default-winston";
import { componentInterfaces, OptionalConfiguration, Configuration } from "./interfaces";

const defaultConfiguration: OptionalConfiguration = {
  winstonInstance: winstonInstance
}

export const descriptor: ComponentDescriptor = {
  name: "core:root",
  interfaces: componentInterfaces,
  defaultConfiguration: defaultConfiguration,
  bindings: {
    root: (bindService) => {
      bindService.bindLocalServiceToSelf(GenericRequestHandler);
      bindService.bindGlobalService("logger").toDynamicValue(context => {
        return (context.container.get<Component>("meta:component//core:root").configuration as any).winstonInstance;
      });
    }
  }
};