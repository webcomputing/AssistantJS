import { componentInterfaces } from "../../../src/components/unifier/private-interfaces";
import { extraction } from "../../support/mocks/unifier/extraction";
import { MockExtractor } from "../../support/mocks/unifier/mock-extractor";
import { MockHandlerA as RealResponseHandler } from "../../support/mocks/unifier/response-handler/mock-handler-a";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { RequestProxy, withServer } from "../../support/util/requester";
import { ThisContext } from "../../this-context";

describe("with child containers enabled", function() {
  beforeEach(function(this: ThisContext) {
    // Use childcontainer for every request
    this.specHelper.prepareSpec({
      bindSingletonChildContainer: false,
    });
    configureI18nLocale(this.assistantJs.container, false);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  });

  describe("when multiple requests fired", function() {
    const FIRE_AMOUNT = 50;

    const extractionData = { intent: "answer", message: "My message", platform: extraction.platform };
    let request: RequestProxy;
    let stopServer: () => void;

    beforeEach(async function(this: ThisContext) {
      [request, stopServer] = await withServer(this.assistantJs);

      // Bind MockExtractor and fitting response handler
      this.inversify.bind(componentInterfaces.requestProcessor).to(MockExtractor);
      this.inversify.bind(`${extraction.platform}:current-response-handler`).to(RealResponseHandler);
    });

    it("handles all of them correctly", async function(this: ThisContext) {
      const requests: Array<Promise<any>> = [];
      const extractions: any[] = [];

      for (let i = 0; i < FIRE_AMOUNT; i++) {
        extractions[i] = { ...extractionData, message: `My message ${i}` };
        requests.push(
          new Promise<any>((resolve, reject) => {
            setTimeout(function() {
              request.post(MockExtractor.fittingPath(), extractions[i]).then(value => resolve(value));
            }, Math.random() * 100);
          })
        );
      }

      const fulfilledPromises = await Promise.all(requests);
      fulfilledPromises.forEach((promise, index) => {
        expect(promise.body.message).toEqual(extractions[index].message);
      });
    });

    afterEach(function() {
      stopServer();
    });
  });
});
