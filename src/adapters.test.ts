import { describe, it, expect, vi, afterEach } from "vitest";
import { routeFor, locationAdapter } from "./adapters";
import { dayItems, moveItem, achievements, fetchRates } from "./engine";
import { freshState, byId } from "./data";
describe("路线与定位边界", () => {
  it("默认行程使用示例路径，编辑后明确回到估算", () => {
    const items = dayItems(freshState().items, 0);
    expect(routeFor(items).source).toBe("demo");
    expect(routeFor(items.slice(0, 2)).source).toBe("estimate");
  });
  it("不接受远处、无定位和精度不足的定位打卡", () => {
    expect(
      locationAdapter.eligible(byId.opera.coordinates, 20, byId.opera),
    ).toBe(true);
    expect(
      locationAdapter.eligible(byId.opera.coordinates, 101, byId.opera),
    ).toBe(false);
    expect(locationAdapter.eligible(null, null, byId.opera)).toBe(false);
    expect(
      locationAdapter.eligible(byId.bryggen.coordinates, 20, byId.opera),
    ).toBe(false);
  });
  it("跨日移动保留自定义时长和稳定 ID，拒绝同日重复", () => {
    const s = freshState();
    s.items[0].end = 600;
    const moved = moveItem(s.items, s.items[0].id, 1).find(
      (i) => i.id === s.items[0].id,
    )!;
    expect(moved.end - moved.start).toBe(60);
    expect(moved.day).toBe(1);
    expect(() =>
      moveItem(
        [...s.items, { ...s.items[0], id: "duplicate", day: 1 }],
        s.items[0].id,
        1,
      ),
    ).toThrow();
  });
  it("步数成就只从记录解锁，餐饮按单日个人份额判断", () => {
    const s = freshState();
    s.expenses = [];
    expect(achievements(s).find((a) => a.id === "steps")?.unlocked).toBe(false);
    s.steps[0] = { value: 20000, source: "manual" };
    expect(achievements(s).find((a) => a.id === "steps")?.unlocked).toBe(true);
    expect(achievements(s).find((a) => a.id === "first")?.unlocked).toBe(false);
    const template = freshState().expenses[0];
    s.expenses = [
      { ...template, amount: 9000, currency: "CNY", participants: ["me"] },
      {
        ...template,
        id: "second",
        day: 1,
        amount: 9000,
        currency: "CNY",
        participants: ["me"],
      },
    ];
    expect(achievements(s).find((a) => a.id === "food")?.unlocked).toBe(false);
    s.expenses[1].day = 0;
    expect(achievements(s).find((a) => a.id === "food")?.unlocked).toBe(true);
  });
});
describe("汇率失败处理", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("断网时拒绝更新，原快照不变", async () => {
    const s = freshState(),
      before = structuredClone(s.rates);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(fetchRates()).rejects.toThrow("offline");
    expect(s.rates).toEqual(before);
  });
  it("拒绝缺失币种的响应", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => [{ quote: "NOK", rate: 11, date: "2026-10-16" }],
        }),
    );
    await expect(fetchRates()).rejects.toThrow("不完整");
  });
});
