import type { BaseEntity, EventType, ISODateString } from "./common";

/**
 * Calendar event / deadline. Source: PROGRAM.md §8
 * `Event { title, date, type, description }`.
 */
export interface Event extends BaseEntity {
  title: string;
  date: ISODateString;
  type: EventType;
  description?: string;
}
