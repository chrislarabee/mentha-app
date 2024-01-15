import * as schemaUtils from "../src/schemas/shared";

test("convertArrayToRecordOfArrays", () => {
  let expected = {
    foo: [
      { a: "foo", b: 123 },
      { a: "foo", b: 456 },
    ],
    bar: [
      { a: "bar", b: 101 },
      { a: "bar", b: 789 },
      { a: "bar", b: 121 },
    ],
  };

  expect(
    schemaUtils.convertArrayToRecordOfArrays(
      [
        { a: "foo", b: 123 },
        { a: "bar", b: 101 },
        { a: "foo", b: 456 },
        { a: "bar", b: 789 },
        { a: "bar", b: 121 },
      ],
      (obj) => obj.a
    )
  ).toEqual(expected);
});

test("removeNullsFromArray", () => {
  let expected = ["a", "b", "c"];
  expect(
    schemaUtils.removeNullsFromArray([null, "a", undefined, "b", null, "c"])
  ).toEqual(expected);
});

test("generateMonthArray", () => {
  expect(schemaUtils.generateMonthArray(new Date(2024, 0, 1), 13)).toEqual([
    new Date(2024, 0, 1),
    new Date(2024, 1, 1),
    new Date(2024, 2, 1),
    new Date(2024, 3, 1),
    new Date(2024, 4, 1),
    new Date(2024, 5, 1),
    new Date(2024, 6, 1),
    new Date(2024, 7, 1),
    new Date(2024, 8, 1),
    new Date(2024, 9, 1),
    new Date(2024, 10, 1),
    new Date(2024, 11, 1),
    new Date(2025, 0, 1),
  ]);
  expect(schemaUtils.generateMonthArray(new Date(2024, 0, 1), -6)).toEqual([
    new Date(2023, 7, 1),
    new Date(2023, 8, 1),
    new Date(2023, 9, 1),
    new Date(2023, 10, 1),
    new Date(2023, 11, 1),
    new Date(2024, 0, 1),
  ]);
  expect(
    schemaUtils.generateMonthArray(new Date(2024, 0, 1), -6, "desc")
  ).toEqual([
    new Date(2024, 0, 1),
    new Date(2023, 11, 1),
    new Date(2023, 10, 1),
    new Date(2023, 9, 1),
    new Date(2023, 8, 1),
    new Date(2023, 7, 1),
  ]);
});
