import { isValidCaregiverEvent } from "./events";

describe("isValidCaregiverEvent", () => {
  it("returns true if our event has correct attributes", () => {
    expect(isValidCaregiverEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
    })).toBe(true);
  })
  it("returns false if our event is missing attributes")
  it("ignores extra attributes")
})