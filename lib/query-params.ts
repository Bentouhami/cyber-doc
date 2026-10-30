export type IntegerQueryResult =
  | { success: true; value: number }
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
