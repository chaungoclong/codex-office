import { describe, expect, it } from "vitest";
import { ConcurrencyGate } from "./index.js";

describe("ConcurrencyGate", () => {
  it("rejects invalid limits", () => {
    expect(() => new ConcurrencyGate(0)).toThrow("positive");
    expect(() => new ConcurrencyGate(1.5)).toThrow("positive");
  });

  it("never exceeds the configured concurrency", async () => {
    const gate = new ConcurrencyGate(2);
    let active = 0;
    let peak = 0;
    await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        gate.run(async () => {
          active += 1;
          peak = Math.max(peak, active);
          await new Promise((resolve) => setTimeout(resolve, 5));
          active -= 1;
          return index;
        }),
      ),
    );
    expect(peak).toBe(2);
    expect(gate.active).toBe(0);
  });

  it("releases a slot when work fails", async () => {
    const gate = new ConcurrencyGate(1);
    await expect(
      gate.run(async () => Promise.reject(new Error("failed"))),
    ).rejects.toThrow("failed");
    await expect(gate.run(async () => "recovered")).resolves.toBe("recovered");
  });
});
