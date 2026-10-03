import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Shared rule for calendar dates (no time): `YYYY-MM-DD` and a real day, so
 * `2026-02-30` is rejected. Used by the due date and by the client's `today`.
 */
export const calendarDate = () =>
  vine
    .string()
    .regex(CALENDAR_DATE)
    .use(
      vine.createRule((value, _options, field) => {
        if (typeof value !== 'string') return
        if (!DateTime.fromISO(value, { zone: 'utc' }).isValid) {
          field.report('The {{ field }} field must be a valid calendar date', 'calendarDate', field)
        }
      })()
    )
