import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";

process.env.JWT_SECRET = "oerms-integration-test-secret-at-least-32-characters";
process.env.JWT_EXPIRES_IN = "1h";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/oerms_test";

const { default: app } = await import("../src/app.js");
let server;
let organizerToken;
let secondOrganizerToken;
let eventId;
let ticketCode;

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  server = app.listen(0);
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise(resolve => server.close(resolve));
});

test("organizer, event, registration, and single-use check-in lifecycle", async () => {
  const organizer = await request(server).post("/api/auth/register").send({
    name: "Test Organizer", email: "organizer@example.test", password: "SecurePass123!"
  }).expect(201);
  organizerToken = organizer.body.token;
  assert.ok(organizerToken);

  const second = await request(server).post("/api/auth/register").send({
    name: "Other Organizer", email: "other@example.test", password: "SecurePass123!"
  }).expect(201);
  secondOrganizerToken = second.body.token;

  const startsAt = new Date(Date.now() + 86400000);
  const endsAt = new Date(Date.now() + 90000000);
  const created = await request(server).post("/api/events").set("Authorization", `Bearer ${organizerToken}`).send({
    title: "Integration Test Event", description: "A test event", venue: "Test Hall",
    startsAt, endsAt, capacity: 1
  }).expect(201);
  eventId = created.body.event._id;
  assert.ok(eventId);

  await request(server).get("/api/events").expect(200).expect(response => {
    assert.equal(response.body.events.length, 1);
    assert.equal(response.body.events[0].title, "Integration Test Event");
  });

  const registration = await request(server).post(`/api/registrations/${eventId}`).send({
    participantName: "Test Student", email: "student@example.test", studentId: "TEST-001"
  }).expect(201);
  ticketCode = registration.body.registration.ticketCode;
  assert.match(ticketCode, /^[a-f0-9]{36}$/);
  assert.match(registration.body.registration.qrDataUrl, /^data:image\/png;base64,/);

  await request(server).post(`/api/registrations/${eventId}`).send({
    participantName: "Second Student", email: "second@example.test"
  }).expect(409);

  await request(server).get(`/api/registrations/manage/${eventId}`).set("Authorization", `Bearer ${secondOrganizerToken}`).expect(403);
  await request(server).get(`/api/registrations/manage/${eventId}`).set("Authorization", `Bearer ${organizerToken}`).expect(200).expect(response => {
    assert.equal(response.body.registrations.length, 1);
    assert.equal(response.body.registrations[0].checkedInAt, null);
  });

  await request(server).post("/api/registrations/check-in").set("Authorization", `Bearer ${organizerToken}`).send({ ticketCode }).expect(200);
  await request(server).post("/api/registrations/check-in").set("Authorization", `Bearer ${organizerToken}`).send({ ticketCode }).expect(409);
});
