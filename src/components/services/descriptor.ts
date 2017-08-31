import { interfaces as inversifyInterfaces } from "inversify";
import { ComponentDescriptor, Component } from "inversify-components";
import { RedisClient } from "redis";

import { DestroyableSession, Configuration } from "./interfaces";
import { Session } from "./session";

const defaultConfiguration: Configuration = {
  redisClient: new RedisClient({}),
  maxLifeTime: 1800
};

export const descriptor: ComponentDescriptor = {
  name: "core:services",
  defaultConfiguration: defaultConfiguration,
  bindings: {
    root: (bindingService) => {
      bindingService.bindGlobalService<inversifyInterfaces.Factory<DestroyableSession>>("session-factory").toFactory<DestroyableSession>(context => {
        return (sessionID: string) => {
          let redisInstance = context.container.get<RedisClient>("core:services:redis-instance");
          let configuration = context.container.get<Component>("meta:component//core:services").configuration as Configuration;
          return new Session(sessionID, redisInstance, configuration.maxLifeTime as number);
        };
      });

      bindingService.bindGlobalService<RedisClient>("redis-instance").toDynamicValue(context => {
        let component = context.container.get<Component>("meta:component//core:services");
        return (component.configuration as Configuration).redisClient;
      })
    }
  }
}