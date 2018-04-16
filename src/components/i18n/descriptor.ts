import * as i18next from "i18next";
import { Component, ComponentDescriptor, Hooks } from "inversify-components";
import { componentInterfaces } from "./component-interfaces";
import { arraySplitter } from "./plugins/array-returns-sample.plugin";
import { Configuration } from "./private-interfaces";

import { injectionNames, Logger } from "../../assistant-source";
import { I18nContext } from "./context";
import { MissingInterpolationExtension, TranslateHelper, TranslateValuesFor } from "./public-interfaces";
import { TranslateHelper as TranslateHelperImpl } from "./translate-helper";
import { I18nextWrapper } from "./wrapper";

const defaultConfiguration: Configuration.Defaults = {
  i18nextInstance: i18next.createInstance(),
  i18nextAdditionalConfiguration: {
    backend: {
      loadPath: process.cwd() + "/config/locales/{{lng}}/{{ns}}.json",
    },
  },
};

export const descriptor: ComponentDescriptor<Configuration.Defaults> = {
  name: "core:i18n",
  interfaces: componentInterfaces,
  defaultConfiguration,
  bindings: {
    root: (bindService, lookupService) => {
      bindService
        .bindGlobalService<I18nextWrapper>("wrapper")
        .to(I18nextWrapper)
        .inSingletonScope();

      bindService
        .bindGlobalService<I18nextWrapper>("spec-wrapper")
        .toDynamicValue(context => {
          return new I18nextWrapper(
            context.container.get<Component<Configuration.Runtime>>("meta:component//core:i18n"),
            context.container.isBound(componentInterfaces.missingInterpolation)
              ? context.container.getAll<MissingInterpolationExtension>(componentInterfaces.missingInterpolation)
              : [],
            context.container.get<Logger>(injectionNames.logger),
            false
          );
        })
        .inSingletonScope();

      // Registers a spec helper function which returns all possible values instead of a sample one
      bindService.bindGlobalService<TranslateValuesFor>("translate-values-for").toDynamicValue(context => {
        return (key: string, options = {}) => {
          return (context.container.get<I18nextWrapper>("core:i18n:spec-wrapper").instance.t(key, options) as string).split(arraySplitter);
        };
      });

      bindService.bindGlobalService<i18next.I18n>("instance").toDynamicValue(context => {
        return context.container.get<I18nextWrapper>("core:i18n:wrapper").instance;
      });
    },
    request: (bindService, lookupService) => {
      bindService.bindGlobalService<TranslateHelper>("current-translate-helper").to(TranslateHelperImpl);
      bindService
        .bindGlobalService<I18nContext>("current-context")
        .to(I18nContext)
        .inSingletonScope();

      // Hook into beforeIntent and save current state and current intent into I18nContext (see above)
      // Since I18nContext is a singleton in request scope, it will be the same context instance for this request.
      bindService.bindExtension<Hooks.Hook>(lookupService.lookup("core:state-machine").getInterface("beforeIntent")).toDynamicValue(context => {
        return (mode, state, stateName, intent) => {
          const currentI18nContext = context.container.get<I18nContext>("core:i18n:current-context");
          currentI18nContext.intent = intent;
          currentI18nContext.state = stateName.charAt(0).toLowerCase() + stateName.slice(1);
          return { success: true, result: currentI18nContext };
        };
      });
    },
  },
};
