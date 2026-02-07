// Time constants in milliseconds
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

Date.prototype.addMinutes = function (minutes: number): Date {
  return new Date(this.getTime() + minutes * MINUTE_MS);
};

Date.prototype.addHours = function (hours: number): Date {
  return new Date(this.getTime() + hours * HOUR_MS);
};

Date.prototype.subtractMinutes = function (minutes: number): Date {
  return new Date(this.getTime() - minutes * MINUTE_MS);
};

Date.prototype.subtractHours = function (hours: number): Date {
  return new Date(this.getTime() - hours * HOUR_MS);
};

Date.prototype.addDays = function (days: number): Date {
  return new Date(this.getTime() + days * 24 * HOUR_MS);
};

Date.prototype.subtractDays = function (days: number): Date {
  return new Date(this.getTime() - days * 24 * HOUR_MS);
};
