import * as request from "request-promise";
import { withServer } from "../../spec-helper";

describe("ServerApplication", function() {
  // Start the server for each of these specs
  beforeEach(async function() {
    await withServer();
  });

  describe("execute", function() {
    it("responds to empty requests with 404", function(done) {
     request("http://localhost:3000/any-given-route").then(response => {
       expect(response.statusCode).toBe(404);
       done();
     });
    });
  });
});