import { Container } from "inversify-components";
import { componentInterfaces } from "../../../src/components/unifier/interfaces";
import { withServer, RequestProxy, expressAppWithTimeout } from "../../support/util/requester";
import { configureI18nLocale } from '../../support/util/i18n-configuration';

import { MockExtractor } from "../../support/mocks/unifier/mock-extractor";
import { extraction } from "../../support/mocks/unifier/extraction";
import { SpokenTextExtractor } from "../../support/mocks/unifier/spoken-text-extractor";

describe("ContextDeriver", function() {
  let request: RequestProxy;
  let stopServer: Function;

  beforeEach(function() {
    configureI18nLocale((this as any).container, false);
  });

  afterEach(function() {
    if (typeof stopServer !== "undefined") stopServer();
  });

  describe("with a valid extractor registered", function() {
    beforeEach(function() {
      (this.container as Container).inversifyInstance.bind(componentInterfaces.requestProcessor).to(MockExtractor);
      (this.container as Container).inversifyInstance.bind(extraction.platform + ":current-response-handler").toConstantValue({});
    });

    describe("when an invalid request was sent", function() {
      beforeEach(async function(done) {
        [request, stopServer] = await withServer(this.assistantJs);
        await request.post("/any-given-route", {a: "b"}, {"header-a": "b"});
        done();
      });

      it("does not set 'core:unifier:current-extraction'", function() {
        expect(() => {
          (this.container as Container).inversifyInstance.get<any>("core:unifier:current-extraction")
        }).toThrow();
      });
    });

    describe("when a valid request was sent", function() {
      const extractionData = {intent: "MyIntent", furtherExtraction: "MyExtraction", platform: extraction.platform };

      beforeEach(async function(done) {
        [request, stopServer] = await withServer(this.assistantJs, expressAppWithTimeout("50ms"));
        await request.post(MockExtractor.fittingPath(), extractionData);
        done();
      });


      it("sets 'core:unifier:current-extraction' to extraction result", function() {
        let extraction = (this.container as Container).inversifyInstance.get<any>("core:unifier:current-extraction");
        expect(extraction).toEqual(extractionData);
      });
    });
  });

  describe("with two valid extractors registered", function() {
    describe("with one of them supporting more interfaces", function() {
      beforeEach(function() {
        (this.container as Container).inversifyInstance.bind(componentInterfaces.requestProcessor).to(MockExtractor);
        (this.container as Container).inversifyInstance.bind(componentInterfaces.requestProcessor).to(SpokenTextExtractor);
        (this.container as Container).inversifyInstance.bind(extraction.platform + ":current-response-handler").toConstantValue({});
      });

      describe("when a valid request was sent", function() {
        const extractionData = {intent: "MyIntent", furtherExtraction: "MyExtraction", platform: extraction.platform };

        beforeEach(async function(done) {
          [request, stopServer] = await withServer(this.assistantJs, expressAppWithTimeout("50ms"));
          await request.post(MockExtractor.fittingPath(), extractionData);
          done();
        });

        it("uses feature richer extractor", function() {
          let extraction = (this.container as Container).inversifyInstance.get<any>("core:unifier:current-extraction");
          expect(extraction.spokenText).toEqual(SpokenTextExtractor.spokenTextFill());
        });
      });
    })
  });
});