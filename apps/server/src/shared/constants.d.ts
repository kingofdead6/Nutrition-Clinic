// GENERATED from apps/client/src/shared by `npm run sync:shared`. Do not edit.
export declare const APP_VERSION = '0.1.0';
export declare const DEFAULT_SETTINGS: {
  clinicName: string;
  tagline: string;
  practitionerTitle: string;
  timezone: string;
  workingHours: (
    | {
        day: 'sun';
        isOpen: true;
        open: string;
        close: string;
      }
    | {
        day: 'mon';
        isOpen: true;
        open: string;
        close: string;
      }
    | {
        day: 'tue';
        isOpen: true;
        open: string;
        close: string;
      }
    | {
        day: 'wed';
        isOpen: true;
        open: string;
        close: string;
      }
    | {
        day: 'thu';
        isOpen: true;
        open: string;
        close: string;
      }
    | {
        day: 'fri';
        isOpen: false;
        open: string;
        close: string;
      }
    | {
        day: 'sat';
        isOpen: true;
        open: string;
        close: string;
      }
  )[];
};
/** Days after a plan's start during which the patient shows as "new plan". */
export declare const NEW_PLAN_WINDOW_DAYS = 7;
/** A patient with no active plan and no visit in this many days is "inactive". */
export declare const INACTIVE_AFTER_DAYS = 60;
export declare const FILE_NUMBER_PREFIX = 'P-';
export declare const UPLOAD_MAX_BYTES: number;
export declare const UPLOAD_IMAGE_MIME_TYPES: readonly ['image/png', 'image/jpeg', 'image/webp'];
/** Display format for dates everywhere in the UI (date-fns tokens). */
export declare const DISPLAY_DATE_FORMAT = 'yyyy/MM/dd';
