const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

export function parseEsakshiDate(
  value: string | null | undefined,
): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const input = value.trim();

  const short = input.match(
    /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/,
  );

  if (short) {
    const [, day, month, year] = short;
    const monthIndex = MONTHS[month];

    if (monthIndex === undefined) {
      return null;
    }

    return new Date(
      Date.UTC(
        Number(year),
        monthIndex,
        Number(day),
      ),
    );
  }

  const long = input.match(
    /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/,
  );

  if (long) {
    const [
      ,
      month,
      day,
      year,
      hour,
      minute,
      second,
      meridiem,
    ] = long;

    const monthIndex = MONTHS[month];

    if (monthIndex === undefined) {
      return null;
    }

    let h = Number(hour);

    if (meridiem === "AM" && h === 12) {
      h = 0;
    }

    if (meridiem === "PM" && h !== 12) {
      h += 12;
    }

    return new Date(
      Date.UTC(
        Number(year),
        monthIndex,
        Number(day),
        h,
        Number(minute),
        Number(second),
      ),
    );
  }

  return null;
}