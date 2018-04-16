import { Container } from "inversify-components";
import { componentInterfaces } from "../../../src/components/unifier/private-interfaces";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { RequestProxy, withServer } from "../../support/util/requester";
import { createSpecHelper } from "../../support/util/setup";

import { extraction } from "../../support/mocks/unifier/extraction";
import { RealResponseHandler } from "../../support/mocks/unifier/handler";
import { MockExtractor } from "../../support/mocks/unifier/mock-extractor";

import { RequestPromise } from "request-promise";

describe("with child containers enabled", function() {
  beforeEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

    this.specHelper = createSpecHelper(true, true);
    this.assistantJs = this.specHelper.setup;
    this.container = this.assistantJs.container;

    configureI18nLocale((this as any).container, false);
  });

  describe("when multiple requests fired", function() {
    const FIRE_AMOUNT = 50;

    const extractionData = { intent: "answer", message: "My message", platform: extraction.platform };
    let request: RequestProxy;
    let stopServer: Function;

    beforeEach(async function(done) {
      [request, stopServer] = await withServer(this.assistantJs);

      // Bind MockExtractor and fitting response handler
      (this.container as Container).inversifyInstance.bind(componentInterfaces.requestProcessor).to(MockExtractor);
      (this.container as Container).inversifyInstance.bind(extraction.platform + ":current-response-handler").to(RealResponseHandler);

      done();
    });

    it("handles all of them correctly", async function(done) {
      const requests: Array<Promise<any>> = [];
      let extractions: any[];

      for (let i = 0; i < FIRE_AMOUNT; i++) {
        extraction[i] = {...extractionData,  message: "My message " + i};
        requests.push(
          new Promise<any>((resolve, reject) => {
            request.post(MockExtractor.fittingPath(), extraction[i]).then(value => resolve(value));
          })
        );
      }

      const fulfilledPromises = await Promise.all(requests);
      for (const i in fulfilledPromises) {
        expect(fulfilledPromises[i].body).toEqual(extraction[i].message);
      }

      done();
    });

    afterEach(function() {
      stopServer();
    });
  });
});
