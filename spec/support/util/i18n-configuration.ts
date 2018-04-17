import * as i18next from "i18next";
import { Container } from "inversify-components";
import { I18nConfiguration } from "../../../src/components/i18n/public-interfaces";

export function configureI18nLocale(
  container: Container,
  debug = false,
  localePath = __dirname + "/../mocks/i18n/locale/{{lng}}/{{ns}}.json",
  instance = i18next.createInstance()
) {
  const config: I18nConfiguration = {
    i18nextInstance: instance,
    i18nextAdditionalConfiguration: {
      debug,
      preload: ["de"],
      lng: "de",
      fallbackLng: "de",
      defaultNS: "translation",
      backend: {
        loadPath: localePath,
        jsonIndent: 2,
      },
      initImmediate: false,
    },
  };
  container.componentRegistry.lookup("core:i18n").addConfiguration(config);
}
