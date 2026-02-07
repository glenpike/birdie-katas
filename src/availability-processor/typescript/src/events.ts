import type { Visit } from "./repositories/visits";

export interface CaregiverEvent {
  /** Unique identifier for the permanent unavailability event */
  id: string;
  /** Unique identifier for the tenant (care agency) */
  tenantId: string;
  /** Unique identifier for the caregiver */
  caregiverId: string;
}

export interface CaregiverPermanentUnavailabilityEvent extends CaregiverEvent {
  /** Time when the permanent unavailability starts */
  effectiveFrom: Date;
}

export interface CaregiverAbsenceBookedEvent extends CaregiverEvent {
  /** Start time of the absence */
  startTime: Date;
  /** End time of the absence */
  endTime: Date;
}

export function isValidCaregiverEvent(event: unknown): event is CaregiverEvent {
  return (event as CaregiverEvent).caregiverId !== undefined
}

export function isCaregiverPermanentUnavailabilityEvent(event: CaregiverPermanentUnavailabilityEvent | CaregiverAbsenceBookedEvent): event is CaregiverPermanentUnavailabilityEvent {
  return (event as CaregiverPermanentUnavailabilityEvent).effectiveFrom !== undefined
}

export interface CaregiverEventHelpers {
  getEffectiveFrom(event: unknown): Date;
  getFutureDate(event: unknown): Date;
  shouldUnassignVisits(visit: Visit, event: unknown): boolean;
}

export class CaregiverPermanentUnavailabilityHelpers implements CaregiverEventHelpers {
  getEffectiveFrom(event: unknown): Date {
    return (event as CaregiverPermanentUnavailabilityEvent).effectiveFrom
  };
  getFutureDate(event: unknown): Date {
    return this.getEffectiveFrom(event).addYears(1);
  };
  shouldUnassignVisits(visit: Visit, event: unknown): boolean {
    return visit.startTime >= this.getEffectiveFrom(event);
  };
}

export class CaregiverAbsenceBookedHelpers implements CaregiverEventHelpers {
  getEffectiveFrom(event: unknown): Date {
    return (event as CaregiverAbsenceBookedEvent).startTime
  }
  getFutureDate(event: unknown): Date {
    return (event as CaregiverAbsenceBookedEvent).endTime
  }
  shouldUnassignVisits(visit: Visit, event: unknown): boolean {
    return visit.startTime >= this.getEffectiveFrom(event) && visit.endTime <= this.getFutureDate(event);
  }
}