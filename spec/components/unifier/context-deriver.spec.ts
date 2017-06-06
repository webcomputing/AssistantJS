import { Container } from "ioc-container";
import { componentInterfaces } from "../../../src/components/unifier/interfaces";
import { withServer, RequestProxy, expressAppWithTimeout } from "../../support/util/requester";

import { MockExtractor } from "../../support/mocks/unifier/mock-extractor";

describe("ContextDeriver", function() {
  let request: RequestProxy;
  let stopServer: Function;

  afterEach(function() {
    if (typeof stopServer !== "undefined") stopServer();
  });

  describe("when an invalid request was sent", function() {
    beforeEach(async function(done) {
      [request, stopServer] = await withServer(this.container);
      await request.post("/any-given-route", {a: "b"}, {"header-a": "b"});
      done();
    });

    it("does not set 'current|core:unifier:current-extraction'", function() {
      expect(() => {
        (this.container as Container).inversifyInstance.get<any>("current|core:unifier:current-extraction")
      }).toThrow();
    });
  });

  describe("with a valid extractor registered", function() {
    beforeEach(function() {
      (this.container as Container).inversifyInstance.bind(componentInterfaces.requestProcessor).to(MockExtractor);
    });

    describe("when a valid request was sent", function() {
      const extractionData = {intent: "MyIntent", furtherExtraction: "MyExtraction"};

      beforeEach(async function(done) {
        [request, stopServer] = await withServer(this.container, expressAppWithTimeout("50ms"));
        // Any request based errors are not reelvant here, we just need the request fired.
        await request.post(MockExtractor.fittingPath(), extractionData);
        done();
      });


      it("sets 'current|core:unifier:current-extraction' to extraction result", function() {
        let extraction = (this.container as Container).inversifyInstance.get<any>("current|core:unifier:current-extraction");
        expect(extraction).toEqual(extractionData);
      });
    });
  })
});