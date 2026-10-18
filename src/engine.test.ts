import { describe, it, expect } from "vitest";
import {
  shares,
  balances,
  settle,
  convert,
  dayItems,
  warnings,
  addItem,
  dateFor,
} from "./engine";
import { freshState, seedRates } from "./data";
describe("账本计算", () => {
  it("确定性分配尾差并去重", () => {
    expect(shares(100, ["b", "a", "c", "a"])).toEqual({ a: 34, b: 33, c: 33 });
    expect(() => shares(100, [])).toThrow();
  });
  it("混合币种和多人付款后余额守恒且转账清零", () => {
    const s = freshState();
    s.expenses.push({
      id: "extra",
      title: "test",
      category: "交通",
      day: 0,
      amount: 10001,
      currency: "EUR",
      payer: "me",
      participants: ["m2", "me"],
    });
    const b = balances(s.expenses, s.members, seedRates, "CNY");
    expect(Object.values(b).reduce((a, b) => a + b, 0)).toBe(0);
    for (const t of settle(s.expenses, s.members, seedRates, "CNY")) {
      b[t.from] += t.amount;
      b[t.to] -= t.amount;
    }
    expect(Object.values(b).every((v) => v === 0)).toBe(true);
  });
  it("个人消费不产生债务，删除和编辑重新计算", () => {
    const s = freshState();
    const personal = { ...s.expenses[0], participants: ["me"] };
    expect(
      Object.values(balances([personal], s.members, seedRates, "NOK")).every(
        (v) => v === 0,
      ),
    ).toBe(true);
    expect(settle([], s.members, seedRates, "CNY")).toEqual([]);
    const before = balances(s.expenses, s.members, seedRates, "NOK");
    s.expenses[0].amount += 3;
    expect(balances(s.expenses, s.members, seedRates, "NOK").me).toBe(
      before.me + 2,
    );
  });
  it("结算快照不受后续汇率与账目变化影响", () => {
    const s = freshState();
    const frozen = structuredClone({ rates: s.rates, expenses: s.expenses });
    const expected = settle(frozen.expenses, s.members, frozen.rates, "CNY");
    s.rates.perEUR.CNY = 9;
    s.expenses[0].amount = 1;
    expect(settle(frozen.expenses, s.members, frozen.rates, "CNY")).toEqual(
      expected,
    );
    expect(convert(100, "EUR", "NOK", seedRates)).toBe(1170);
  });
});
describe("行程", () => {
  it("默认时间、重复与时间冲突", () => {
    const item = addItem([], "opera", 0)[0];
    expect([item.start, item.end]).toEqual([540, 630]);
    expect(() => addItem([item], "opera", 0)).toThrow();
    const other = { ...item, id: "2", placeId: "munch", start: 600, end: 700 };
    expect(warnings([item, other], 0)[0]).toContain("重叠");
    expect(dayItems([item, other], 1)).toEqual([]);
  });
  it("按旅行日期递增而不受设备时区影响", () => {
    expect(dateFor("2027-06-30", 1)).toBe("2027-07-01");
  });
});
