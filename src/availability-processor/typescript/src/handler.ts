import type { CaregiverPermanentUnavailabilityEvent, CaregiverAbsenceBookedEvent } from "./events";
import type { VisitRepository } from "./repositories/visits";

function isCaregiverPermanentUnavailabilityEvent(event: CaregiverPermanentUnavailabilityEvent | CaregiverAbsenceBookedEvent): event is CaregiverPermanentUnavailabilityEvent {
  return (event as CaregiverPermanentUnavailabilityEvent).effectiveFrom !== undefined
}
/**
 * EventProcessor handles caregiver availability events
 */
export class EventProcessor {
  constructor(private readonly visitRepo: VisitRepository) { }

  async handleEvent(
    event: CaregiverPermanentUnavailabilityEvent | CaregiverAbsenceBookedEvent
  ): Promise<void> {
    const effectiveFrom = isCaregiverPermanentUnavailabilityEvent(event) ? event.effectiveFrom : event.startTime;

    const futureDate = new Date(
      effectiveFrom.getTime() + 365 * 24 * 60 * 60 * 1000
    ); // 1 year in the future

    const visits = await this.visitRepo.getCalendar(
      event.caregiverId,
      effectiveFrom,
      futureDate
    );

    // Unassign all visits that occur after the permanent unavailability starts
    for (const visit of visits) {
      if (visit.startTime >= effectiveFrom) {
        await this.visitRepo.unassign(visit.id, event.caregiverId);
      }
    }
  }
}
