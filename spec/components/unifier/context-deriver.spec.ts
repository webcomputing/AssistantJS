import { Component, Container, getMetaInjectionName } from "inversify-components";
import * as _ from "lodash";
import { componentInterfaces as rootComponentInterfaces } from "../../../src/components/root/private-interfaces";
import { componentInterfaces, Configuration } from "../../../src/components/unifier/private-interfaces";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { RequestProxy, withServer } from "../../support/util/requester";

import {
  AssistantJSSetup,
  injectionNames,
  MinimalRequestExtraction,
  OptionalExtractions,
  RequestContext,
  RequestExtractor,
  UnifierConfiguration,
} from "../../../src/assistant-source";
import { ContextDeriver } from "../../../src/components/unifier/context-deriver";
import { createContext } from "../../support/mocks/root/request-context";
import { createExtraction, extraction } from "../../support/mocks/unifier/extraction";
import { MockExtractor } from "../../support/mocks/unifier/mock-extractor";
import { MockRequestExtractionModifier } from "../../support/mocks/unifier/mock-request-modifier";
import { MockRequestExtractionSessionModifier } from "../../support/mocks/unifier/mock-request-session-modifier";
import { MockHandlerA } from "../../support/mocks/unifier/response-handler/mock-handler-a";
import { SpokenTextExtractor } from "../../support/mocks/unifier/spoken-text-extractor";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  mockExtraction: MinimalRequestExtraction & OptionalExtractions.SessionData;
  mockRequestContext: RequestContext;
  assistantJs: AssistantJSSetup;
  deriver: ContextDeriver;
}

describe("ContextDeriver", function() {
  beforeEach(function(this: ThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
  });

  describe("with server started", function() {
    let request: RequestProxy;
    let stopServer: () => void;

    beforeEach(function(this: CurrentThisContext) {
      // Remove emitting of warnings
      this.specHelper.bindSpecLogger("error");

      configureI18nLocale(this.assistantJs.container, false);
    });

    afterEach(function() {
      if (typeof stopServer !== "undefined") stopServer();
    });

    describe("with a valid extractor registered", function(this: CurrentThisContext) {
      beforeEach(function(this: ThisContext) {
        this.inversify.bind(componentInterfaces.requestProcessor).to(MockExtractor);
        this.inversify.bind(`${extraction.platform}:current-response-handler`).to(MockHandlerA);
      });

      describe("when an invalid request was sent", function() {
        beforeEach(async function() {
          [request, stopServer] = await withServer(this.assistantJs);
          await request.post("/any-given-route", { a: "b" }, { "header-a": "b" });
        });

        it("does not set 'core:unifier:current-extraction'", function(this: CurrentThisContext) {
          expect(this.inversify.isBound(injectionNames.current.extraction)).toBeFalsy();
        });
      });

      describe("when a valid request was sent", function() {
        const extractionData = { intent: "MyIntent", furtherExtraction: "MyExtraction", platform: extraction.platform, sessionData: null };

        beforeEach(async function() {
          [request, stopServer] = await withServer(this.assistantJs);
          await request.post(MockExtractor.fittingPath(), extractionData);
        });

        it("sets 'core:unifier:current-extraction' to extraction result", function(this: CurrentThisContext) {
          const currentExtraction = this.inversify.get<any>(injectionNames.current.extraction);
          expect(currentExtraction).toEqual(extractionData);
        });
      });
    });

    describe("with two valid extractors registered", function() {
      describe("with some support equal number of features", function() {
        function rebindUniferConfigWith(this: CurrentThisContext, conf: UnifierConfiguration) {
          const unifier = this.assistantJs.container.componentRegistry.lookup<UnifierConfiguration>("core:unifier");
          unifier.addConfiguration(_.merge(unifier.configuration, conf));
        }

        beforeEach(async function(this: CurrentThisContext) {
          this.inversify.bind(componentInterfaces.requestProcessor).toDynamicValue(() => new SpokenTextExtractor("MockA"));
          this.inversify.bind(componentInterfaces.requestProcessor).toDynamicValue(() => new SpokenTextExtractor("MockB"));
          this.inversify.bind(componentInterfaces.requestProcessor).toDynamicValue(() => new MockExtractor("MockC"));
        });

        it("throws on deriving current extraction", async function(this: CurrentThisContext) {
          try {
            await this.inversify.get<ContextDeriver>(rootComponentInterfaces.contextDeriver).derive(createContext());
          } catch (e) {
            expect(e.message).toMatch(/Multiple extractors fit to this request/);
          }
        });

        describe("with false parameter `disableMostFeaturesWin`", function() {
          beforeEach(async function(this: CurrentThisContext) {
            rebindUniferConfigWith.call(this, {
              contextDeriver: {
                disableMostFeaturesWin: true,
              },
            });
          });

          it("throws an error", async function(this: CurrentThisContext) {
            try {
              await this.inversify.get<ContextDeriver>(rootComponentInterfaces.contextDeriver).findExtractor(createContext());
            } catch (error) {
              expect(error.message).toMatch(/cannot set disableMostFeaturesWin without requestExtractorPriority/);
            }
          });
        });

        describe("with a priority list", function() {
          beforeEach(async function(this: CurrentThisContext) {
            rebindUniferConfigWith.call(this, {
              contextDeriver: {
                requestExtractorPriority: ["MockC", "MockB", "MockA"],
              },
            });
          });

          it("selects suitable extractor by using priority list.", async function(this: CurrentThisContext) {
            const extractor = await this.inversify.get<ContextDeriver>(rootComponentInterfaces.contextDeriver).findExtractor(createContext());
            expect((extractor as RequestExtractor).component.name).toEqual("MockB");
          });

          describe("with `most features win` being disabled", function() {
            beforeEach(async function(this: CurrentThisContext) {
              rebindUniferConfigWith.call(this, {
                contextDeriver: {
                  disableMostFeaturesWin: true,
                },
              });
            });

            it("selects by priority only", async function(this: CurrentThisContext) {
              const extractor = await this.inversify.get<ContextDeriver>(rootComponentInterfaces.contextDeriver).findExtractor(createContext());
              expect((extractor as RequestExtractor).component.name).toEqual("MockC");
            });
          });
        });
      });

      describe("with one of them supporting more interfaces", function() {
        beforeEach(function(this: CurrentThisContext) {
          this.inversify.bind(componentInterfaces.requestProcessor).to(MockExtractor);
          this.inversify.bind(componentInterfaces.requestProcessor).to(SpokenTextExtractor);
          this.inversify.bind(`${extraction.platform}:current-response-handler`).to(MockHandlerA);
        });

        describe("when a valid request was sent", function() {
          const extractionData = { intent: "MyIntent", furtherExtraction: "MyExtraction", platform: extraction.platform, sessionData: null };

          beforeEach(async function(this: CurrentThisContext) {
            [request, stopServer] = await withServer(this.assistantJs);
            await request.post(MockExtractor.fittingPath(), extractionData);
          });

          it("uses extractor with more implemented features", async function(this: CurrentThisContext) {
            const currentExtraction = this.inversify.get<any>(injectionNames.current.extraction);
            expect(currentExtraction.spokenText).toEqual(SpokenTextExtractor.spokenTextFill());
          });
        });
      });
    });
  });

  describe("with a valid extractor configured", function() {
    beforeEach(function(this: CurrentThisContext) {
      this.inversify.bind(componentInterfaces.requestProcessor).to(MockExtractor);
      this.inversify.bind(`${extraction.platform}:current-response-handler`).toConstantValue({ sessionData: null });

      // Craete mock extraction and a fitting request context for it
      this.mockExtraction = createExtraction("myTest", { testEntity: "value1", testEntity2: "value2" });
      this.mockRequestContext = createContext("POST", "/fitting_path", this.mockExtraction);
    });

    describe("#derive", function() {
      beforeEach(function(this: CurrentThisContext) {
        // Grab deriver
        this.deriver = this.inversify.get(rootComponentInterfaces.contextDeriver);
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
              sessionData: "**filtered**",
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
              sessionData: "**filtered**",
            });
            done();
          });
        });

        describe("with default whitelist", function() {
          it("filters everything except intent, language and platform", async function(done) {
            await this.deriver.derive(this.mockRequestContext);
            this.expectLoggingWithExtraction({ ...this.mockExtraction, sessionID: "**filtered**", entities: "**filtered**", sessionData: "**filtered**" });
            done();
          });
        });
      });
    });

    describe("with RequestExtractionModifier registerd", function() {
      describe("without RequestExtractionModifier", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.deriver = this.inversify.get(rootComponentInterfaces.contextDeriver);
        });

        it("does not change RequestExtraction, expect for sessionid", async function() {
          const result = await this.deriver.derive(this.mockRequestContext);
          expect(result[0] as MinimalRequestExtraction).toEqual({
            ...this.mockExtraction,
            sessionID: `${this.mockExtraction.platform}-${this.mockExtraction.sessionID}`,
          });
        });
      });

      describe("with one RequestExtractionModifier", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.inversify.bind(componentInterfaces.requestModifier).to(MockRequestExtractionSessionModifier);
          this.deriver = this.inversify.get(rootComponentInterfaces.contextDeriver);
        });

        it("returns changed RequestExtraction", async function() {
          const result = await this.deriver.derive(this.mockRequestContext);
          expect((result[0] as MinimalRequestExtraction).sessionID).toBe("my-new-session-id");
        });
      });

      describe("with multiple RequestExtractionModifier", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.inversify.bind(componentInterfaces.requestModifier).to(MockRequestExtractionSessionModifier);
          this.inversify.bind(componentInterfaces.requestModifier).to(MockRequestExtractionModifier);
          this.deriver = this.inversify.get(rootComponentInterfaces.contextDeriver);
        });

        it("changes to last RequestModifier", async function() {
          const result = await this.deriver.derive(this.mockRequestContext);
          expect((result[0] as MinimalRequestExtraction).sessionID).toBe("my-second-session-id");
          expect((result[0] as MinimalRequestExtraction).intent).toBe("my-new-intent");
        });
      });
    });
  });
});
