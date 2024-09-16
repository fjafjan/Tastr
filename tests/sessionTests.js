const request = require("supertest");
const app = require("./backend/Server"); // Import your Express app

describe("GET /greet", () => {
  it("should return a message with status 200", async () => {
    const res = await request(app).get("/greet");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Hello, World!");
  });
});
