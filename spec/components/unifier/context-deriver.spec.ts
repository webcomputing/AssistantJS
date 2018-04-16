import { Container } from "inversify-components";
import { componentInterfaces as rootComponentInterfaces } from "../../../src/components/root/private-interfaces";
import { componentInterfaces } from "../../../src/components/unifier/private-interfaces";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { expressAppWithTimeout, RequestProxy, withServer } from "../../support/util/requester";

import { createContext } from "../../support/mocks/root/request-context";
import { createExtraction, extraction } from "../../support/mocks/unifier/extraction";
import { MockExtractor } from "../../support/mocks/unifier/mock-extractor";
import { SpokenTextExtractor } from "../../support/mocks/unifier/spoken-text-extractor";

describe("ContextDeriver", function() {
  describe("with server started", function() {
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
          await request.post("/any-given-route", { a: "b" }, { "header-a": "b" });
          done();
        });

        it("does not set 'core:unifier:current-extraction'", function() {
          expect(() => {
            (this.container as Container).inversifyInstance.get<any>("core:unifier:current-extraction");
          }).toThrow();
        });
      });

      describe("when a valid request was sent", function() {
        const extractionData = { intent: "MyIntent", furtherExtraction: "MyExtraction", platform: extraction.platform };

        beforeEach(async function(done) {
          [request, stopServer] = await withServer(this.assistantJs, expressAppWithTimeout("50ms"));
          await request.post(MockExtractor.fittingPath(), extractionData);
          done();
        });

        it("sets 'core:unifier:current-extraction' to extraction result", function() {
          const extraction = (this.container as Container).inversifyInstance.get<any>("core:unifier:current-extraction");
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
          const extractionData = { intent: "MyIntent", furtherExtraction: "MyExtraction", platform: extraction.platform };

          beforeEach(async function(done) {
            [request, stopServer] = await withServer(this.assistantJs, expressAppWithTimeout("50ms"));
            await request.post(MockExtractor.fittingPath(), extractionData);
            done();
          });

          it("uses feature richer extractor", function() {
            const extraction = (this.container as Container).inversifyInstance.get<any>("core:unifier:current-extraction");
            expect(extraction.spokenText).toEqual(SpokenTextExtractor.spokenTextFill());
          });
        });
      });
    });
  });

  describe("with a valid extractor configured", function() {
    beforeEach(function() {
      (this.container as Container).inversifyInstance.bind(componentInterfaces.requestProcessor).to(MockExtractor);
      (this.container as Container).inversifyInstance.bind(extraction.platform + ":current-response-handler").toConstantValue({});
    });

    describe("derive", function() {
      beforeEach(function() {
        // Grab deriver
        this.deriver = this.container.inversifyInstance.get(rootComponentInterfaces.contextDeriver);

        // Craete mock extraction and a fitting request context for it
        this.mockExtraction = createExtraction("myTest", { testEntity: "value1", testEntity2: "value2" });
        this.mockRequestContext = createContext("POST", "/fitting_path", this.mockExtraction);
      });

      describe("logging", function() {
        beforeEach(function() {
          // Set spy on logger
          spyOn(this.deriver.logger, "info").and.callThrough();

          this.expectLoggingWithExtraction = extraction => {
            expect(this.deriver.logger.info).toHaveBeenCalledWith(
              { requestId: "mock-fixed-request-id", extraction },
              "Resolved current extraction by platform."
            );
          };
        });

        describe("with whitelist set to ['intent', {entities: ['testEntity']}]", function() {
          beforeEach(function() {
            this.deriver.loggingWhitelist = ["intent", { entities: ["testEntity"] }];
          });

          it("filters out only one of two entities", async function(done) {
            await this.deriver.derive(this.mockRequestContext);
            this.expectLoggingWithExtraction({
              sessionID: "**filtered**",
              entities: { testEntity: "value1", testEntity2: "**filtered**" },
              intent: "myTest",
              language: "**filtered**",
              platform: "**filtered**",
            });
            done();
          });
        });

        describe("with whitelist set to []", function() {
          beforeEach(function() {
            this.deriver.loggingWhitelist = [];
          });

          it("filters every element of extraction", async function(done) {
            await this.deriver.derive(this.mockRequestContext);
            this.expectLoggingWithExtraction({
              sessionID: "**filtered**",
              entities: "**filtered**",
              intent: "**filtered**",
              language: "**filtered**",
              platform: "**filtered**",
            });
            done();
          });
        });

        describe("with default whitelist", function() {
          it("filters everything except intent, language and platform", async function(done) {
            await this.deriver.derive(this.mockRequestContext);
            this.expectLoggingWithExtraction({...this.mockExtraction,  sessionID: "**filtered**", entities: "**filtered**"});
            done();
          });
        });
      });
    });
  });
});
