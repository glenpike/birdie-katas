import type {
  CaregiverPermanentUnavailabilityEvent,
  CaregiverAbsenceBookedEvent,
} from "./events";
import {
  isCaregiverEvent,
  isCaregiverPermanentUnavailabilityEvent,
  CaregiverEventHelpers,
  CaregiverPermanentUnavailabilityHelpers,
  CaregiverAbsenceBookedHelpers
} from "./events";
import type { VisitRepository } from "./repositories/visits";


/**
 * EventProcessor handles caregiver availability events
 */
export class EventProcessor {
  constructor(private readonly visitRepo: VisitRepository) { }

  async handleEvent(
    event: CaregiverPermanentUnavailabilityEvent | CaregiverAbsenceBookedEvent
  ): Promise<void> {
    isCaregiverEvent(event);

    const eventHelpers: CaregiverEventHelpers = isCaregiverPermanentUnavailabilityEvent(event)
      ? new CaregiverPermanentUnavailabilityHelpers()
      : new CaregiverAbsenceBookedHelpers();

    const visits = await this.visitRepo.getCalendar(
      event.caregiverId,
      eventHelpers.getEffectiveFrom(event),
      eventHelpers.getFutureDate(event),
    );

    // Unassign all visits that match our events
    for (const visit of visits) {
      if (eventHelpers.shouldUnassignVisits(visit, event)) {
        await this.visitRepo.unassign(visit.id, event.caregiverId);
      }
    }
  }
}
