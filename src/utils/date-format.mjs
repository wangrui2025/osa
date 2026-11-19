/** Calendar-only display. Parsing never constructs Date, so no timezone can move a day. */
export function calendarParts(value) {
  if (typeof value !== 'string') throw new TypeError('Calendar value must be a string');
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
  if (!match) throw new RangeError(`Expected YYYY, YYYY-MM, or YYYY-MM-DD: ${value}`);
  const [, year, month, day] = match;
  const y = Number(year), m = Number(month), d = Number(day);
  if (y < 1 || (month && (m < 1 || m > 12))) throw new RangeError(`Invalid calendar date: ${value}`);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day && (d < 1 || d > days[m - 1])) throw new RangeError(`Invalid calendar date: ${value}`);
  return { year, month, day, precision: day ? 'day' : month ? 'month' : 'year' };
}

export function formatCalendar(value, lang = 'en') {
  const { year, month, day } = calendarParts(value);
  if (lang === 'en') return value;
  if (lang !== 'zh') throw new RangeError(`Unsupported language: ${lang}`);
  return `${year}年${month ? `${Number(month)}月` : ''}${day ? `${Number(day)}日` : ''}`;
}

/** Only the known conference-date field uses this legacy month-label adapter. */
export function conferenceDate(value) {
  const zh = /^(\d{4})年(\d{1,2})月$/.exec(value);
  const en = /^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})$/.exec(value);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const result = zh ? `${zh[1]}-${zh[2].padStart(2, '0')}` : en ? `${en[2]}-${String(months.indexOf(en[1]) + 1).padStart(2, '0')}` : value;
  calendarParts(result);
  return result;
}
