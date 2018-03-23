import { injectable } from "inversify";
import { Container } from "inversify-components";
import { RequestContext } from "../../../src/components/root/public-interfaces";
import { AbstractResponseHandler } from "../../../src/components/unifier/abstract-response-handler";
import { componentInterfaces } from "../../../src/components/unifier/private-interfaces";
import {
  AfterResponseHandler,
  BeforeResponseHandler,
  MinimalRequestExtraction,
  MinimalResponseHandler,
  ResponseHandlerExtensions,
} from "../../../src/components/unifier/public-interfaces";
import { createRequestScope } from "../../support/util/setup";

interface CurrentThisContext {
  specHelper;
  assistantJs;
  container: Container;
  instance: AbstractResponseHandler;
  afterResponseHandler?: AfterResponseHandler;
  beforeResponseHandler?: BeforeResponseHandler;
  minimalExtraction: MinimalRequestExtraction;
  sendResponse();
}

describe("AbstractResponseHandler", function(this: CurrentThisContext) {
  beforeEach(async function(this: CurrentThisContext) {
    this.minimalExtraction = { platform: "mock", intent: "genericIntent", sessionID: "session123", language: "de" };
    this.sendResponse = () => {
      @injectable()
      class MockResponseHelper extends AbstractResponseHandler {
        public getBody() {
          return;
        }
      }

      createRequestScope(this.specHelper, this.minimalExtraction, undefined, MockResponseHelper);
      this.instance = this.container.inversifyInstance.get<AbstractResponseHandler>("mock:current-response-handler");

      this.instance.sendResponse();
    };
  });

  describe("when sendResponse is called", function(this: CurrentThisContext) {
    describe("with bound beforeSendResponseHandler", function() {
      describe("with injected ResponseHandlers", function() {
        beforeEach(async function(this: CurrentThisContext) {
          // tslint:disable-next-line:max-classes-per-file
          @injectable()
          class MockBeforeResponseHandler implements BeforeResponseHandler {
            public execute(responseHandler: MinimalResponseHandler) {
              return;
            }
          }

          this.container.inversifyInstance
            .bind(componentInterfaces.beforeSendResponse)
            .to(MockBeforeResponseHandler)
            .inSingletonScope();
          this.beforeResponseHandler = this.container.inversifyInstance.get<BeforeResponseHandler>(componentInterfaces.beforeSendResponse);
          spyOn(this.beforeResponseHandler, "execute");

          this.sendResponse();
        });
        it("calls execute on injected ReponseHandlers", async function(this: CurrentThisContext) {
          expect((this.beforeResponseHandler as BeforeResponseHandler).execute).toHaveBeenCalledTimes(1);
          expect((this.beforeResponseHandler as BeforeResponseHandler).execute).toHaveBeenCalledWith(this.instance);
        });
      });
    });
  });

  describe("with bound afterSendResponseHandler", function() {
    describe("with injected ResponseHandlers", function() {
      beforeEach(async function(this: CurrentThisContext) {
        // tslint:disable-next-line:max-classes-per-file
        @injectable()
        class MockAfterResponseHandler implements AfterResponseHandler {
          public execute(responseHandler: MinimalResponseHandler) {
            return;
          }
        }

        this.container.inversifyInstance
          .bind(componentInterfaces.afterSendResponse)
          .to(MockAfterResponseHandler)
          .inSingletonScope();
        this.afterResponseHandler = this.container.inversifyInstance.get<AfterResponseHandler>(componentInterfaces.afterSendResponse);
        spyOn(this.afterResponseHandler, "execute");

        this.sendResponse();
      });
      it("calls execute on injected ReponseHandlers", async function(this: CurrentThisContext) {
        expect((this.afterResponseHandler as AfterResponseHandler).execute).toHaveBeenCalledTimes(1);
        expect((this.afterResponseHandler as AfterResponseHandler).execute).toHaveBeenCalledWith(this.instance);
      });
    });
  });
});
