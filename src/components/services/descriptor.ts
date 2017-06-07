import { interfaces as inversifyInterfaces } from "inversify";
import { ComponentDescriptor, Component } from "ioc-container";
import { RedisClient } from "redis";

import { DestroyableSession, Configuration } from "./interfaces";
import { Session } from "./session";

const defaultConfiguration: Configuration = {
  redisClient: new RedisClient({})
};

export const descriptor: ComponentDescriptor = {
  name: "core:services",
  defaultConfiguration: defaultConfiguration,
  bindings: {
    root: (bindingService) => {
      bindingService.bindGlobalService<inversifyInterfaces.Factory<DestroyableSession>>("session-factory").toFactory<DestroyableSession>(context => {
        return (sessionID: string) => {
          let component = context.container.get<Component>("meta:component//core:services");
          let redisInstance = (component.configuration as Configuration).redisClient;

          return new Session(sessionID, redisInstance);
        };
      });
    }
  }
}