// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
export const APP_VERSION = '0.1.0';
export const DEFAULT_SETTINGS = {
  clinicName: 'عيادة التغذية',
  tagline: 'صحتك ... توازن حياتك',
  practitionerTitle: 'أخصائية التغذية',
  timezone: 'Africa/Algiers',
  workingHours: [
    { day: 'sun', isOpen: true, open: '08:30', close: '16:30' },
    { day: 'mon', isOpen: true, open: '08:30', close: '16:30' },
    { day: 'tue', isOpen: true, open: '08:30', close: '16:30' },
    { day: 'wed', isOpen: true, open: '08:30', close: '16:30' },
    { day: 'thu', isOpen: true, open: '08:30', close: '16:30' },
    { day: 'fri', isOpen: false, open: '08:30', close: '12:00' },
    { day: 'sat', isOpen: true, open: '09:00', close: '13:00' },
  ],
};
/** Days after a plan's start during which the patient shows as "new plan". */
export const NEW_PLAN_WINDOW_DAYS = 7;
/** A patient with no active plan and no visit in this many days is "inactive". */
export const INACTIVE_AFTER_DAYS = 60;
export const FILE_NUMBER_PREFIX = 'P-';
export const UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const UPLOAD_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
/** Display format for dates everywhere in the UI (date-fns tokens). */
export const DISPLAY_DATE_FORMAT = 'yyyy/MM/dd';
