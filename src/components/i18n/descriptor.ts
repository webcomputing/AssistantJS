import * as i18next from "i18next";
import { Component, ComponentDescriptor, getMetaInjectionName, Hooks } from "inversify-components";
import { componentInterfaces } from "./component-interfaces";
import { arraySplitter } from "./plugins/array-returns-sample.plugin";
import { Configuration } from "./private-interfaces";

import { injectionNames, Logger } from "../../assistant-source";
import { LocalesLoader } from "../unifier/public-interfaces";
import { I18nContext } from "./context";
import { InterpolationResolver as InterpolationResolverImpl } from "./interpolation-resolver";
import { InterpolationResolver, TranslateHelper, TranslateHelperFactory, TranslateValuesFor } from "./public-interfaces";
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
            context.container.get<Component<Configuration.Runtime>>(getMetaInjectionName("core:i18n")),
            context.container.get<Logger>(injectionNames.logger),
            context.container.get<LocalesLoader>(injectionNames.localesLoader),
            false
          );
        })
        .inSingletonScope();

      bindService.bindGlobalService<InterpolationResolver>("interpolation-resolver").to(InterpolationResolverImpl);

      bindService.bindGlobalService<typeof i18next>("instance").toDynamicValue(context => {
        return context.container.get<I18nextWrapper>(injectionNames.i18nWrapper).instance;
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
          const currentI18nContext = context.container.get<I18nContext>(injectionNames.current.i18nContext);
          currentI18nContext.intent = intent;
          currentI18nContext.state = stateName.charAt(0).toLowerCase() + stateName.slice(1);
          return { success: true, result: currentI18nContext };
        };
      });

      // Registers a spec helper function which returns all possible values instead of a sample one
      bindService.bindGlobalService<TranslateValuesFor>("current-translate-values-for").toDynamicValue(context => {
        return async (key: string, options = {}): Promise<string[]> => {
          const translations: string[] = context.container
            .get<I18nextWrapper>(injectionNames.i18nSpecWrapper)
            .instance.t(key, options)
            .split(arraySplitter);
          const translateHelper = context.container.get<TranslateHelper>(injectionNames.current.translateHelper);

          return Promise.all(
            translations.map(async translation =>
              context.container.get<InterpolationResolver>(injectionNames.i18nInterpolationResolver).resolveMissingInterpolations(translation, translateHelper)
            )
          );
        };
      });

      // Registers a service which provides a translate helper for other context than the default one
      bindService.bindGlobalService<TranslateHelperFactory>("current-translate-helper-factory").toFactory(context => (state: string, intent: string) =>
        new TranslateHelperImpl(
          context.container.get(injectionNames.i18nInstance),
          {
            intent,
            state: state.replace(/^[A-Z]/, m => m.toLocaleLowerCase()),
          },
          context.container.get(injectionNames.current.extraction),
          context.container.get(injectionNames.current.logger),
          context.container.get(injectionNames.i18nInterpolationResolver)
        )
      );
    },
  },
};
