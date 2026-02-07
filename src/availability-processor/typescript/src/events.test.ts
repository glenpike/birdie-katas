import { validateBaseCaregiverEvent, isCaregiverEvent, isCaregiverPermanentUnavailabilityEvent, isCaregiverAbsenceBookedEvent } from "./events";

describe("validateBaseCaregiverEvent", () => {
  it("returns true if our event has correct attributes", () => {
    expect(validateBaseCaregiverEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
    })).toBe(true);
  })
  it("returns false if our event is missing the caregiverId", () => {
    expect(validateBaseCaregiverEvent({
      id: "1",
      tenantId: "tenant-1",
    })).toBe(false);
  })
  it("returns false if our event is missing the id", () => {
    expect(validateBaseCaregiverEvent({
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
    })).toBe(false);
  })
  it("returns false if our event is missing the tenantId", () => {
    expect(validateBaseCaregiverEvent({
      id: "1",
      caregiverId: "caregiver-1",
    })).toBe(false);
  });

  it("ignores extra attributes", () => {
    expect(validateBaseCaregiverEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      someExtraAttribute: "someValue",
    })).toBe(true);
  });

  it("checks the type of id correctly", () => {
    expect(validateBaseCaregiverEvent({
      id: 1,
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
    })).toBe(false);
  });

  it("checks the type of tenantId correctly", () => {
    expect(validateBaseCaregiverEvent({
      id: "1",
      tenantId: 123,
      caregiverId: "caregiver-1",
    })).toBe(false);
  });

  it("checks the type of caregiverId correctly", () => {
    expect(validateBaseCaregiverEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: null,
    })).toBe(false);
  });
});

describe("isCaregiverPermanentUnavailabilityEvent", () => {
  it("returns true if our event has the correct attributes", () => {
    expect(isCaregiverPermanentUnavailabilityEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      effectiveFrom: new Date(),
    })).toBe(true);
  });

  it("checks types correctly", () => {
    expect(isCaregiverPermanentUnavailabilityEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      effectiveFrom: 'test',
    })).toBe(false);
  });

  it("effectiveFrom can't be null", () => {
    expect(isCaregiverPermanentUnavailabilityEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      effectiveFrom: null,
    })).toBe(false);
  });

  it("checks parent event types correctly", () => {
    expect(isCaregiverPermanentUnavailabilityEvent({
      id: 1,
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      effectiveFrom: new Date(),
    })).toBe(false);
  });
});

describe("isCaregiverAbsenceBookedEvent", () => {
  it("returns true if our event has the correct attributes", () => {
    expect(isCaregiverAbsenceBookedEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      startTime: new Date(),
      endTime: new Date(),
    })).toBe(true);
  });

  it("checks startTime type correctly", () => {
    expect(isCaregiverAbsenceBookedEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      startTime: 'test',
      endTime: new Date(),
    })).toBe(false);
  });

  it("checks endTime type correctly", () => {
    expect(isCaregiverAbsenceBookedEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      startTime: new Date(),
      endTime: 'test',
    })).toBe(false);
  });

  it("startTime can't be null", () => {
    expect(isCaregiverAbsenceBookedEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      startTime: null,
      endTime: new Date(),
    })).toBe(false);
  });

  it("endTime can't be null", () => {
    expect(isCaregiverAbsenceBookedEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      startTime: new Date(),
      endTime: null,
    })).toBe(false);
  });

  it("checks parent event types correctly", () => {
    expect(isCaregiverAbsenceBookedEvent({
      id: "1",
      tenantId: 123,
      caregiverId: "caregiver-1",
      startTime: new Date(),
      endTime: new Date(),
    })).toBe(false);
  });
});

describe("isCaregiverEvent", () => {
  it("returns true for a CaregiverPermanentUnavailabilityEvent", () => {
    expect(isCaregiverEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      effectiveFrom: new Date(),
    })).toBe(true);
  });
  it("returns true for a CaregiverAbsenceBookedEvent", () => {
    expect(isCaregiverEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
      startTime: new Date(),
      endTime: new Date(),
    })).toBe(true);
  });

  it("throws an error for invalid event", () => {
    expect(() => isCaregiverEvent({
      id: "1",
      tenantId: "tenant-1",
      caregiverId: "caregiver-1",
    })).toThrow("Event is not a CaregiverPermanentUnavailabilityEvent or CaregiverAbsenceBookedEvent")
  })
});