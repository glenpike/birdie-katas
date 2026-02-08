import { EventProcessor } from "./handler";
import type { CaregiverAbsenceBookedEvent, CaregiverPermanentUnavailabilityEvent } from "./events";
import { VisitRepository, type Visit } from "./repositories/visits";

// Import date extensions to allow for use of methods like addHours, subtractMinutes, etc.
import "./date-extensions";

const testTenantId = "tenant-1";
const testCaregiverId = "caregiver-1";

describe("EventProcessor", () => {
  describe("handleEvent", () => {
    it("processes permanent unavailability event correctly", async () => {
      const visits: Visit[] = [
        {
          // This visit is before the permanent unavailability and should remain assigned
          id: "visit-1",
          tenantId: testTenantId,
          patientId: "patient-1",
          caregiverId: testCaregiverId,
          startTime: new Date("2025-11-06T10:00:00.000Z"), // Day before
          endTime: new Date("2025-11-06T11:00:00.000Z"),
        },
        {
          // This visit is after the permanent unavailability and should be unassigned
          id: "visit-2",
          tenantId: testTenantId,
          patientId: "patient-2",
          caregiverId: testCaregiverId,
          startTime: new Date("2025-11-08T10:00:00.000Z"), // Day after
          endTime: new Date("2025-11-08T11:00:00.000Z"),
        },
      ];

      // Create repository and processor
      const repo = new VisitRepository(visits);
      const eventProcessor = new EventProcessor(repo);

      // Create a permanent unavailability event starting on Nov 7th
      const unavailabilityEvent: CaregiverPermanentUnavailabilityEvent = {
        id: "unavailability-1",
        tenantId: testTenantId,
        caregiverId: testCaregiverId,
        effectiveFrom: new Date("2025-11-07T00:00:00.000Z"), // Start of Nov 7th
      };

      // Process the permanent unavailability event
      await eventProcessor.handleEvent(unavailabilityEvent);

      // Check the results - get all visits by not specifying caregiver ID
      const allVisits = await repo.getCalendar(
        null,
        new Date("2025-11-01T00:00:00.000Z"),
        new Date("2026-11-01T00:00:00.000Z")
      );

      // Visits should be in the same order as they were created
      expect(allVisits).toHaveLength(2);

      // Check visit-1 (position 0, before unavailability) remains assigned
      expect(allVisits[0].id).toBe("visit-1");
      expect(allVisits[0].caregiverId).toBe(testCaregiverId);

      // Check visit-2 (position 1, after unavailability) was unassigned
      expect(allVisits[1].id).toBe("visit-2");
      expect(allVisits[1].caregiverId).toBe("");
    });

    it(
      "handles visits starting exactly at unavailability time",
      async () => {
        // When a visit starts exactly at the same time as the permanent unavailability,
        // that visit should also be unassigned.

        const startTime = new Date("2025-11-07T00:00:00.000Z");

        const visits: Visit[] = [
          {
            // This visit starts exactly at the unavailability time and should be unassigned
            id: "visit-1",
            tenantId: testTenantId,
            patientId: "patient-1",
            caregiverId: testCaregiverId,
            startTime,
            endTime: new Date(startTime.getTime() + 60 * 60 * 1000), // 1 hour later
          },
        ];

        // Create repository and processor
        const repo = new VisitRepository(visits);
        const eventProcessor = new EventProcessor(repo);

        // Create a permanent unavailability event starting on Nov 7th
        const unavailabilityEvent: CaregiverPermanentUnavailabilityEvent = {
          id: "unavailability-1",
          tenantId: testTenantId,
          caregiverId: testCaregiverId,
          effectiveFrom: startTime,
        };

        // Process the permanent unavailability event
        await eventProcessor.handleEvent(unavailabilityEvent);

        // Check the results - get all visits by not specifying caregiver ID
        const allVisits = await repo.getCalendar(
          null,
          new Date("2025-11-01T00:00:00.000Z"),
          new Date("2026-11-01T00:00:00.000Z")
        );

        // Check visit-1 was unassigned
        expect(allVisits[0].id).toBe("visit-1");
        expect(allVisits[0].caregiverId).toBe("");
      }
    );

    describe("temporary absence", () => {
      it("absence before visit remains assigned", async () => {
        const absenceStartTime = new Date("2025-11-06T10:00:00.000Z");
        const absenceEndTime = absenceStartTime.addHours(1);
        const visits: Visit[] = [
          {
            id: "visit-1",
            tenantId: testTenantId,
            patientId: "patient-1",
            caregiverId: testCaregiverId,
            startTime: absenceStartTime.addDays(1),
            endTime: absenceEndTime.addDays(1),
          },
        ];

        // Create repository and processor
        const repo = new VisitRepository(visits);
        const eventProcessor = new EventProcessor(repo);

        // Create a permanent unavailability event starting on Nov 6th
        const absenceEvent: CaregiverAbsenceBookedEvent = {
          id: "unavailability-1",
          tenantId: testTenantId,
          caregiverId: testCaregiverId,
          startTime: absenceStartTime,
          endTime: absenceEndTime,
        };

        // Process the absence event
        await eventProcessor.handleEvent(absenceEvent);

        // Check the results - get all visits by not specifying caregiver ID
        const allVisits = await repo.getCalendar(
          null,
          new Date("2025-11-01T00:00:00.000Z"),
          new Date("2026-11-01T00:00:00.000Z")
        );

        // Visit should still exist
        expect(allVisits).toHaveLength(1);
        // Visit should not be unassigned
        expect(allVisits[0].caregiverId).toBe(testCaregiverId);
      });

      it("absence after visit remains assigned", async () => {
        const absenceStartTime = new Date("2025-11-06T10:00:00.000Z");
        const absenceEndTime = absenceStartTime.addHours(1);
        // Visit is on 5th of November
        const visits: Visit[] = [
          {
            id: "visit-1",
            tenantId: testTenantId,
            patientId: "patient-1",
            caregiverId: testCaregiverId,
            startTime: absenceStartTime.subtractDays(1),
            endTime: absenceEndTime.subtractDays(1),
          },
        ];

        // Create repository and processor
        const repo = new VisitRepository(visits);
        const eventProcessor = new EventProcessor(repo);

        // Create a permanent unavailability event starting on Nov 6th
        const absenceEvent: CaregiverAbsenceBookedEvent = {
          id: "unavailability-1",
          tenantId: testTenantId,
          caregiverId: testCaregiverId,
          startTime: absenceStartTime,
          endTime: absenceEndTime,
        };

        // Process the absence event
        await eventProcessor.handleEvent(absenceEvent);

        // Check the results - get all visits by not specifying caregiver ID
        const allVisits = await repo.getCalendar(
          null,
          new Date("2025-11-01T00:00:00.000Z"),
          new Date("2026-11-01T00:00:00.000Z")
        );

        // Visit should still exist
        expect(allVisits).toHaveLength(1);
        // Visit should not be unassigned
        expect(allVisits[0].caregiverId).toBe(testCaregiverId);
      });

      it("when absence includes visit it unassigns the visit", async () => {
        const absenceStartTime = new Date("2025-11-06T10:00:00.000Z");
        const absenceEndTime = absenceStartTime.addHours(3);
        const visits: Visit[] = [
          {
            id: "visit-1",
            tenantId: testTenantId,
            patientId: "patient-1",
            caregiverId: testCaregiverId,
            startTime: absenceStartTime.addHours(1),
            endTime: absenceStartTime.addHours(2),
          },
        ];

        // Create repository and processor
        const repo = new VisitRepository(visits);
        const eventProcessor = new EventProcessor(repo);

        // Create a permanent unavailability event starting on Nov 6th
        const absenceEvent: CaregiverAbsenceBookedEvent = {
          id: "unavailability-1",
          tenantId: testTenantId,
          caregiverId: testCaregiverId,
          startTime: absenceStartTime,
          endTime: absenceEndTime,
        };

        // Process the absence event
        await eventProcessor.handleEvent(absenceEvent);

        // Check the results - get all visits by not specifying caregiver ID
        const allVisits = await repo.getCalendar(
          null,
          new Date("2025-11-01T00:00:00.000Z"),
          new Date("2026-11-01T00:00:00.000Z")
        );

        // Visit should still exist
        expect(allVisits).toHaveLength(1);
        // Visit should be unassigned
        expect(allVisits[0].caregiverId).toBe("");
      });

      it("when absence spans more than one visit it unassigns them all", async () => {
        const absenceStartTime = new Date("2025-11-06T10:00:00.000Z");
        const absenceEndTime = absenceStartTime.addDays(2).addHours(3);
        const visits: Visit[] = [
          {
            id: "visit-1",
            tenantId: testTenantId,
            patientId: "patient-1",
            caregiverId: testCaregiverId,
            startTime: absenceStartTime.addHours(1), // Visit starts after absence start
            endTime: absenceStartTime.addHours(2), // Visit ends before absence end
          },
          {
            id: "visit-2",
            tenantId: testTenantId,
            patientId: "patient-2",
            caregiverId: testCaregiverId,
            startTime: absenceStartTime.addDays(1), // Visit starts after absence start
            endTime: absenceStartTime.addDays(1).addHours(2), // Visit ends before absence end
          },
        ];

        // Create repository and processor
        const repo = new VisitRepository(visits);
        const eventProcessor = new EventProcessor(repo);

        // Create an absence event starting on Nov 6th and ending two days, 3 hours after
        const absenceEvent: CaregiverAbsenceBookedEvent = {
          id: "unavailability-1",
          tenantId: testTenantId,
          caregiverId: testCaregiverId,
          startTime: absenceStartTime,
          endTime: absenceEndTime,
        };

        // Process the absence event
        await eventProcessor.handleEvent(absenceEvent);

        // Check the results - get all visits by not specifying caregiver ID
        const allVisits = await repo.getCalendar(
          null,
          new Date("2025-11-01T00:00:00.000Z"),
          new Date("2026-11-01T00:00:00.000Z")
        );

        // Visits should still exist
        expect(allVisits).toHaveLength(2);
        // Visit should be unassigned
        expect(allVisits[0].caregiverId).toBe("");
        expect(allVisits[1].caregiverId).toBe("");

      });
      it("when absence starts during visit but ends after it doesn't unassign", async () => {
        const absenceStartTime = new Date("2025-11-06T10:00:00.000Z");
        const absenceEndTime = absenceStartTime.addDays(1);
        const visits: Visit[] = [
          {
            id: "visit-1",
            tenantId: testTenantId,
            patientId: "patient-1",
            caregiverId: testCaregiverId,
            startTime: absenceStartTime.subtractHours(1), // Visit starts before absence start
            endTime: absenceEndTime.subtractHours(1), // Visit ends before absence end
          },
        ];

        // Create repository and processor
        const repo = new VisitRepository(visits);
        const eventProcessor = new EventProcessor(repo);

        // Create absence event starting on Nov 6th and ending a day after
        const absenceEvent: CaregiverAbsenceBookedEvent = {
          id: "unavailability-1",
          tenantId: testTenantId,
          caregiverId: testCaregiverId,
          startTime: absenceStartTime,
          endTime: absenceEndTime,
        };

        // Process the absence event
        await eventProcessor.handleEvent(absenceEvent);

        // Check the results - get all visits by not specifying caregiver ID
        const allVisits = await repo.getCalendar(
          null,
          new Date("2025-11-01T00:00:00.000Z"),
          new Date("2026-11-01T00:00:00.000Z")
        );

        // Visit should still exist
        expect(allVisits).toHaveLength(1);
        // Visit should be not be unassigned
        expect(allVisits[0].caregiverId).toBe("caregiver-1");
      });

      it("when absence starts before visit but ends during it doesn't unassign", async () => {
        const absenceStartTime = new Date("2025-11-06T10:00:00.000Z");
        const absenceEndTime = absenceStartTime.addDays(1);
        const visits: Visit[] = [
          {
            id: "visit-1",
            tenantId: testTenantId,
            patientId: "patient-1",
            caregiverId: testCaregiverId,
            startTime: absenceStartTime.addHours(1), // Visit starts after absence start
            endTime: absenceEndTime.addHours(1), // Visit ends after absence end
          },
        ];

        // Create repository and processor
        const repo = new VisitRepository(visits);
        const eventProcessor = new EventProcessor(repo);

        // Create an absence event starting on Nov 6th and ending a day after
        const absenceEvent: CaregiverAbsenceBookedEvent = {
          id: "unavailability-1",
          tenantId: testTenantId,
          caregiverId: testCaregiverId,
          startTime: absenceStartTime,
          endTime: absenceEndTime,
        };

        // Process the absence event
        await eventProcessor.handleEvent(absenceEvent);

        // Check the results - get all visits by not specifying caregiver ID
        const allVisits = await repo.getCalendar(
          null,
          new Date("2025-11-01T00:00:00.000Z"),
          new Date("2026-11-01T00:00:00.000Z")
        );

        // Visit should still exist
        expect(allVisits).toHaveLength(1);
        // Visit should be not be unassigned
        expect(allVisits[0].caregiverId).toBe("caregiver-1");
      });
    });

    describe("invalid events", () => {
      it("raises an error if our CaregiverPermanentUnavailabilityEvent is not valid ", async () => {

        const visits: Visit[] = [
          {
            id: "visit-1",
            tenantId: testTenantId,
            patientId: "patient-1",
            caregiverId: testCaregiverId,
            startTime: new Date("2025-11-06T10:00:00.000Z"),
            endTime: new Date("2025-11-06T11:00:00.000Z"),
          },
        ];

        // Create repository and processor
        const repo = new VisitRepository(visits);
        const eventProcessor = new EventProcessor(repo);

        // Create an invalid permanent unavailability event
        const unavailabilityEvent: CaregiverPermanentUnavailabilityEvent = {
          id: "unavailability-1",
          tenantId: testTenantId,
          caregiverId: testCaregiverId,
          // @ts-ignore
          effectiveFrom: null
        };

        expect(async () => {
          await eventProcessor.handleEvent(unavailabilityEvent)
        }).rejects.toThrowError()
      });

      it("raises an error if our CaregiverAbsenceBookedEvent is not valid ", async () => {

        const visits: Visit[] = [
          {
            id: "visit-1",
            tenantId: testTenantId,
            patientId: "patient-1",
            caregiverId: testCaregiverId,
            startTime: new Date("2025-11-06T10:00:00.000Z"),
            endTime: new Date("2025-11-06T11:00:00.000Z"),
          },
        ];

        // Create repository and processor
        const repo = new VisitRepository(visits);
        const eventProcessor = new EventProcessor(repo);

        // Create an invalid absence event
        const absenceEvent: CaregiverAbsenceBookedEvent = {
          id: "unavailability-1",
          tenantId: testTenantId,
          caregiverId: testCaregiverId,
          // @ts-ignore
          startTime: null,
          endTime: new Date("2025-11-06T10:00:00.000Z"),
        };

        expect(async () => {
          await eventProcessor.handleEvent(absenceEvent)
        }).rejects.toThrowError()
      });
    });
  });
});
