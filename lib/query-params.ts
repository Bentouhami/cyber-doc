export type IntegerQueryResult =
  | { success: true; value: number }
  | {
      success: false;
      error: {
        message: "Invalid query parameter";
        issues: Array<{ parameter: string; expected: string }>;
      };
    };

export const MAX_DATABASE_INTEGER = 2_147_483_647;

export type DateOnlyQueryResult =
  | { success: true; value: Date | null }
  | {
      success: false;
      error: {
        message: "Invalid query parameter";
        issues: Array<{ parameter: string; expected: string }>;
      };
    };

type IntegerQueryOptions = {
  defaultValue: number;
  min: number;
  max: number;
};

export function parseIntegerQueryParam(
  searchParams: URLSearchParams,
  parameter: string,
  options: IntegerQueryOptions,
): IntegerQueryResult {
  const rawValue = searchParams.get(parameter);
  if (rawValue === null) {
    return { success: true, value: options.defaultValue };
  }

  const value = Number(rawValue);
  const isValid =
    rawValue.trim() !== "" &&
    Number.isSafeInteger(value) &&
    value >= options.min &&
    value <= options.max;

  if (!isValid) {
    return {
      success: false,
      error: {
        message: "Invalid query parameter",
        issues: [
          {
            parameter,
            expected: `integer between ${options.min} and ${options.max}`,
          },
        ],
      },
    };
  }

  return { success: true, value };
}

export function parseDateOnlyQueryParam(
  searchParams: URLSearchParams,
  parameter: string,
  options: { nextDay?: boolean } = {},
): DateOnlyQueryResult {
  const rawValue = searchParams.get(parameter);
  if (rawValue === null) {
    return { success: true, value: null };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawValue);
  const year = Number(match?.[1]);
  const month = Number(match?.[2]);
  const day = Number(match?.[3]);
  const value = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    match !== null &&
    value.getUTCFullYear() === year &&
    value.getUTCMonth() === month - 1 &&
    value.getUTCDate() === day;

  if (!isValid) {
    return {
      success: false,
      error: {
        message: "Invalid query parameter",
        issues: [{ parameter, expected: "date in YYYY-MM-DD format" }],
      },
    };
  }

  if (options.nextDay) {
    value.setUTCDate(value.getUTCDate() + 1);
  }
  return { success: true, value };
}
