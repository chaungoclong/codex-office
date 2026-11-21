import { describe, expect, it } from "vitest";
import { assertTransition, canTransition } from "./index.js";

describe("task workflow", () => {
  it("returns failed tests to implementation", () =>
    expect(canTransition("testing", "in_progress")).toBe(true));
  it("blocks done without independent evidence", () =>
    expect(canTransition("reviewing", "done")).toBe(false));
  it("allows done with all gates", () =>
    expect(
      canTransition("reviewing", "done", {
        acceptanceCriteriaMet: true,
        selfTestPassed: true,
        testerPassed: true,
        reviewerPassed: true,
        blockingDefects: 0,
      }),
    ).toBe(true));
  it("rejects skipped workflow stages", () => {
    expect(canTransition("pending", "in_progress")).toBe(false);
    expect(() => assertTransition("pending", "in_progress")).toThrow(
      "pending -> in_progress",
    );
  });
  it("allows blocked work to return to implementation", () =>
    expect(canTransition("blocked", "in_progress")).toBe(true));
});
