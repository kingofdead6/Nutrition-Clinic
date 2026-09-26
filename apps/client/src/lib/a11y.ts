/** aria-describedby value matching FormField's hint/error ids. */
export const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;
