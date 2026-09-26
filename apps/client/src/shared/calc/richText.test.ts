import { describe, expect, it } from 'vitest';
import { escapeHtml, fillPlaceholders, placeholdersIn } from './richText';

describe('fillPlaceholders', () => {
  it('replaces tokens (with optional spaces) and escapes values', () => {
    expect(
      fillPlaceholders('<p>السيدة {{patientName}} — {{ dailyCalories }} سعرة</p>', {
        patientName: 'فاطمة <b>بن</b> عيسى',
        dailyCalories: 1500,
      }),
    ).toBe('<p>السيدة فاطمة &lt;b&gt;بن&lt;/b&gt; عيسى — 1500 سعرة</p>');
  });

  it('turns unknown or empty tokens into a dash', () => {
    expect(fillPlaceholders('{{nope}} / {{empty}} / {{zero}}', { empty: '', zero: 0 })).toBe(
      '— / — / 0',
    );
  });

  it('leaves single braces alone', () => {
    expect(fillPlaceholders('{a} {{ }}', {})).toBe('{a} {{ }}');
  });
});

describe('helpers', () => {
  it('escapeHtml', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });

  it('placeholdersIn lists unique names', () => {
    expect(placeholdersIn('{{a}} {{b}} {{ a }}')).toEqual(['a', 'b']);
  });
});
