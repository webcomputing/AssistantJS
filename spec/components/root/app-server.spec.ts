import { withServer, RequestProxy } from "../../support/util/requester";

describe("ServerApplication", function() {
  let request: RequestProxy;
  let stopServer: Function;

  beforeEach(async function(done) {
    [request, stopServer] = await withServer();
    done();
  });

  afterEach(function() {
    stopServer();
  });

  describe("execute", function() {
    it("responds to empty requests with 404", async function(done) {
      let response = await request.get("/any-given-route");
      console.log(response);
      console.log("this was the response");
      expect(response.statusCode).toBe(404);
      done();
    });
  });
});