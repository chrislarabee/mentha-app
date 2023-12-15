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
