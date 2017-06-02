import { withServer, RequestProxy } from "../../support/util/requester";

describe("ServerApplication", function() {
  let request: RequestProxy;
  let stopServer: Function;

  beforeEach(async function(done) {
    console.log("current container", this.container.inversifyInstance.guid);
    [request, stopServer] = await withServer(this.container);
    done();
  });

  afterEach(function() {
    stopServer();
  });

  describe("execute", function() {
    it("responds to empty requests with 404", async function(done) {
      let response = await request.get("/any-given-route");
      expect(response.statusCode).toBe(404);
      done();
    });
  });
});