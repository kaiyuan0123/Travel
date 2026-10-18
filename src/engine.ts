import {
  byId,
  type Currency,
  type Expense,
  type Rates,
  type Member,
  type Item,
  type State,
} from "./data";
export const time = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const minute = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
};
export const uid = () => crypto.randomUUID();
export const money = (cents: number, currency: Currency) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
export const convert = (
  amount: number,
  from: Currency,
  to: Currency,
  rates: Rates,
) => Math.round((amount / rates.perEUR[from]) * rates.perEUR[to]);
export function shares(amount: number, ids: string[]) {
  const sorted = [...new Set(ids)].sort();
  if (!sorted.length) throw new Error("请选择分摊成员");
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("金额无效");
  const base = Math.floor(amount / sorted.length),
    extra = amount % sorted.length;
  return Object.fromEntries(
    sorted.map((id, i) => [id, base + (i < extra ? 1 : 0)]),
  );
}
export function balances(
  expenses: Expense[],
  members: Member[],
  rates: Rates,
  currency: Currency,
) {
  const result = Object.fromEntries(members.map((m) => [m.id, 0]));
  for (const e of expenses) {
    const total = convert(e.amount, e.currency, currency, rates);
    result[e.payer] += total;
    for (const [id, share] of Object.entries(shares(total, e.participants)))
      result[id] -= share;
  }
  return result;
}
export function settle(
  expenses: Expense[],
  members: Member[],
  rates: Rates,
  currency: Currency,
) {
  const b = balances(expenses, members, rates, currency),
    credit = Object.entries(b)
      .filter(([, v]) => v > 0)
      .map(([id, value]) => ({ id, value })),
    debt = Object.entries(b)
      .filter(([, v]) => v < 0)
      .map(([id, value]) => ({ id, value: -value }));
  const transfers: { from: string; to: string; amount: number }[] = [];
  let i = 0,
    j = 0;
  while (i < debt.length && j < credit.length) {
    const amount = Math.min(debt[i].value, credit[j].value);
    transfers.push({ from: debt[i].id, to: credit[j].id, amount });
    debt[i].value -= amount;
    credit[j].value -= amount;
    if (!debt[i].value) i++;
    if (!credit[j].value) j++;
  }
  return transfers;
}
export function distance(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180,
    deltaLat = (b[1] - a[1]) * rad,
    deltaLng = (b[0] - a[0]) * rad;
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(deltaLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export const dayItems = (items: Item[], day: number) =>
  items.filter((i) => i.day === day).sort((a, b) => a.start - b.start);
export function moveItem(items: Item[], id: string, target: number) {
  const item = items.find((i) => i.id === id);
  if (!item || item.day === target) return items;
  if (items.some((i) => i.day === target && i.placeId === item.placeId))
    throw new Error("目标日期已安排这个景点");
  const targetItems = dayItems(items, target);
  const start = targetItems.length
    ? Math.max(...targetItems.map((i) => i.end)) + 30
    : 540;
  const end = start + item.end - item.start;
  if (end >= 1440) throw new Error("目标日期时间不足，请选择其他日期");
  return items.map((i) =>
    i.id === id ? { ...i, day: target, start, end } : i,
  );
}
export function addItem(items: Item[], placeId: string, day: number): Item[] {
  const current = dayItems(items, day);
  if (current.some((i) => i.placeId === placeId))
    throw new Error("这一天已经安排了这个景点");
  const start = current.length
    ? Math.max(...current.map((i) => i.end)) + 30
    : 540;
  const end = start + byId[placeId].duration;
  if (end >= 1440) throw new Error("这一天已经很充实了，换一天试试");
  return [...items, { id: uid(), placeId, day, start, end }];
}
export function warnings(items: Item[], day: number) {
  const sorted = dayItems(items, day);
  return sorted.flatMap((item, i) => {
    if (!i) return [];
    const last = sorted[i - 1];
    const gap = item.start - last.end;
    const travel = Math.ceil(
      distance(byId[last.placeId].coordinates, byId[item.placeId].coordinates) /
        65,
    );
    if (gap < 0) return [`${byId[item.placeId].name}与上一项时间重叠`];
    if (gap < Math.max(15, travel))
      return [`前往${byId[item.placeId].name}的交通缓冲可能不足（估算）`];
    return [];
  });
}
export function optimize(items: Item[]) {
  if (items.length < 3) return items;
  const pool = items.slice(1),
    ordered = [items[0]];
  while (pool.length) {
    const last = byId[ordered.at(-1)!.placeId];
    let best = 0;
    pool.forEach((p, i) => {
      if (
        distance(last.coordinates, byId[p.placeId].coordinates) <
        distance(last.coordinates, byId[pool[best].placeId].coordinates)
      )
        best = i;
    });
    ordered.push(pool.splice(best, 1)[0]);
  }
  return ordered;
}
export function reschedule(ordered: Item[], start?: number) {
  let next = start ?? ordered[0]?.start ?? 540;
  return ordered.map((item) => {
    const duration = item.end - item.start;
    const updated = { ...item, start: next, end: next + duration };
    next = updated.end + 30;
    return updated;
  });
}
export function achievements(s: State) {
  const unique = new Set(s.checkins.map((c) => c.placeId));
  const cities = new Set([...unique].map((id) => byId[id]?.city));
  const meal = s.expenses
    .filter((e) => e.category === "餐饮")
    .reduce(
      (sum, e) =>
        sum +
        (shares(convert(e.amount, e.currency, "CNY", s.rates), e.participants)
          .me ?? 0),
      0,
    );
  const bigMeal = [0, 1, 2, 3, 4].some(
    (day) =>
      s.expenses
        .filter((e) => e.day === day && e.category === "餐饮")
        .reduce(
          (sum, e) =>
            sum +
            (shares(
              convert(e.amount, e.currency, "CNY", s.rates),
              e.participants,
            ).me ?? 0),
          0,
        ) > 10000,
  );
  return [
    {
      id: "first",
      icon: "✨",
      name: "第一枚足迹",
      detail: "完成第一次景点打卡",
      unlocked: unique.size > 0,
    },
    {
      id: "cities",
      icon: "🏔️",
      name: "双城漫游者",
      detail: "在 Oslo 与 Bergen 都留下足迹",
      unlocked: cities.size === 2,
    },
    {
      id: "five",
      icon: "🧭",
      name: "探索不停",
      detail: "一天打卡 5 个不同景点",
      unlocked: [0, 1, 2, 3, 4].some(
        (d) =>
          new Set(s.checkins.filter((c) => c.day === d).map((c) => c.placeId))
            .size >= 5,
      ),
    },
    {
      id: "steps",
      icon: "👟",
      name: "健步如飞",
      detail: "一天记录 20,000 步（手动/演示）",
      unlocked: Object.values(s.steps).some((v) => v.value >= 20000),
    },
    {
      id: "food",
      icon: "🍜",
      name: "大胃王",
      detail: `单日个人餐饮分摊超过 ¥100 · 共 ${money(meal, "CNY")}`,
      unlocked: bigMeal,
    },
  ];
}
export function dateFor(start: string, day: number) {
  const date = new Date(start + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + day);
  return date.toISOString().slice(0, 10);
}
export async function fetchRates(): Promise<Rates> {
  const r = await fetch(
    "https://api.frankfurter.dev/v2/rates?base=EUR&quotes=NOK,CNY",
    { signal: AbortSignal.timeout(10000) },
  );
  if (!r.ok) throw new Error("汇率暂不可用");
  const rows = (await r.json()) as {
    date: string;
    quote: string;
    rate: number;
  }[];
  const nok = rows.find((r) => r.quote === "NOK"),
    cny = rows.find((r) => r.quote === "CNY");
  if (
    !nok ||
    !cny ||
    !Number.isFinite(nok.rate) ||
    !Number.isFinite(cny.rate) ||
    nok.rate <= 0 ||
    cny.rate <= 0
  )
    throw new Error("汇率数据不完整");
  return {
    source: "Frankfurter",
    date: [nok.date, cny.date].sort()[0],
    perEUR: { EUR: 1, NOK: nok.rate, CNY: cny.rate },
  };
}
