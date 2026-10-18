import { useState, useEffect, type FormEvent } from "react";
import {
  Plus,
  ArrowRight,
  RefreshCw,
  Pencil,
  Trash2,
  Wallet,
  Users,
  ReceiptText,
  LockKeyhole,
} from "lucide-react";
import { ANIMALS, type State, type Currency, type Expense } from "./data";
import {
  balances,
  convert,
  dateFor,
  fetchRates,
  money,
  settle,
  uid,
} from "./engine";
import { Modal } from "./ui";
export interface StoreProps {
  state: State;
  update: (f: (s: State) => State) => void;
  notify: (s: string) => void;
}
export function Expenses({
  state: s,
  update,
  notify,
  day,
}: { day: number } & StoreProps) {
  const [currency, setCurrency] = useState<Currency>("CNY"),
    [form, setForm] = useState<Expense | null | false>(false),
    [showSettlement, setShowSettlement] = useState(false),
    [manual, setManual] = useState(false),
    [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(false);
  const expenses =
    filter === "all"
      ? s.expenses
      : s.expenses.filter((e) => e.day === Number(filter));
  const total = expenses.reduce(
    (a, e) => a + convert(e.amount, e.currency, currency, s.rates),
    0,
  );
  async function refresh() {
    setBusy(true);
    try {
      const rates = await fetchRates();
      update((x) => ({ ...x, rates }));
      notify("参考汇率已更新");
    } catch {
      notify("汇率暂不可用，保留当前带日期的汇率");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (s.rates.source === "manual") return;
    let active = true;
    fetchRates()
      .then((rates) => {
        if (active)
          update((x) => (x.rates.source === "manual" ? x : { ...x, rates }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const snapshot = s.settlement;
  return (
    <div className="expenses-panel">
      <div className="section-eyebrow">LITTLE EXPENSES, BIG MEMORIES</div>
      <div className="panel-title">
        <h2>
          旅行小账本<span>一起出发，轻松分账</span>
        </h2>
        <span className="title-sticker">🪙</span>
      </div>
      <div className="expense-total">
        <span>这趟旅行花了</span>
        <select
          aria-label="展示币种"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
        >
          {["CNY", "NOK", "EUR"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <strong>{money(total, currency)}</strong>
        <small>示例账目可编辑 · {expenses.length} 笔记录</small>
        <div className="mini-bars">
          {[0, 1, 2, 3, 4].map((d) => (
            <div
              key={d}
              style={{
                height:
                  12 +
                  Math.min(
                    30,
                    s.expenses.filter((e) => e.day === d).length * 12,
                  ),
              }}
              title={`第 ${d + 1} 天`}
            />
          ))}
        </div>
      </div>
      <div className="rate-note">
        <div>
          <RefreshCw size={13} />{" "}
          {s.rates.source === "demo"
            ? "演示参考价"
            : s.rates.source === "manual"
              ? "手动汇率"
              : "Frankfurter 每日参考价"}{" "}
          · {s.rates.date}
        </div>
        <small>
          1 EUR ≈ {s.rates.perEUR.NOK.toFixed(3)} NOK /{" "}
          {s.rates.perEUR.CNY.toFixed(3)} CNY
        </small>
        <div>
          <button onClick={refresh} disabled={busy}>
            {busy ? "更新中…" : "刷新汇率"}
          </button>
          <button onClick={() => setManual(true)}>手动输入</button>
        </div>
      </div>
      <div className="list-heading">
        <select
          aria-label="费用日期筛选"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">全部日期</option>
          {[0, 1, 2, 3, 4].map((d) => (
            <option value={d} key={d}>
              第 {d + 1} 天
            </option>
          ))}
        </select>
        <button className="text-btn" onClick={() => setForm(null)}>
          <Plus size={15} />
          记一笔
        </button>
      </div>
      <div className="expense-list">
        {expenses.length ? (
          expenses.map((e) => (
            <div className="expense-row" key={e.id}>
              <span className={"expense-emoji cat-" + e.category}>
                {
                  (
                    {
                      餐饮: "🍜",
                      交通: "🚆",
                      住宿: "🛏️",
                      景点: "🎟️",
                      购物: "🛍️",
                      其他: "🧾",
                    } as Record<string, string>
                  )[e.category]
                }
              </span>
              <div>
                <b>{e.title}</b>
                <small>
                  D{e.day + 1} · {s.members.find((m) => m.id === e.payer)?.name}
                  付款 · {e.participants.length}人分摊
                </small>
                <div className="row-actions">
                  <button
                    aria-label={`编辑${e.title}`}
                    onClick={() => setForm(e)}
                  >
                    <Pencil size={12} />
                    编辑
                  </button>
                  <button
                    aria-label={`删除${e.title}`}
                    onClick={() => {
                      update((x) => ({
                        ...x,
                        expenses: x.expenses.filter((v) => v.id !== e.id),
                      }));
                      notify("已删除账目，结算快照保留");
                    }}
                  >
                    <Trash2 size={12} />
                    删除
                  </button>
                </div>
              </div>
              <strong>{money(e.amount, e.currency)}</strong>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <ReceiptText />
            <p>还没有账目，记下旅行的第一笔吧。</p>
          </div>
        )}
      </div>
      <div className="category-summary">
        {["餐饮", "交通", "住宿", "景点", "购物", "其他"].map((c) => {
          const amount = expenses
            .filter((e) => e.category === c)
            .reduce(
              (a, e) => a + convert(e.amount, e.currency, currency, s.rates),
              0,
            );
          return (
            amount > 0 && (
              <div key={c}>
                <span>{c}</span>
                <b>{money(amount, currency)}</b>
              </div>
            )
          );
        })}
      </div>
      <button
        className="primary full"
        onClick={() => {
          update((x) => ({
            ...x,
            settlement: structuredClone({
              at: new Date().toISOString(),
              currency,
              rates: x.rates,
              expenses: x.expenses,
              members: x.members,
            }),
          }));
          setShowSettlement(true);
        }}
      >
        <Wallet size={17} />
        生成结算建议
        <ArrowRight size={16} />
      </button>
      {snapshot && (
        <button
          className="text-btn full"
          onClick={() => setShowSettlement(true)}
        >
          <LockKeyhole size={13} />
          查看上次冻结的结算单
        </button>
      )}
      {form !== false && (
        <ExpenseForm
          expense={form}
          day={day}
          state={s}
          onClose={() => setForm(false)}
          onSave={(e) => {
            update((x) => ({
              ...x,
              expenses: form
                ? x.expenses.map((v) => (v.id === e.id ? e : v))
                : [...x.expenses, e],
            }));
            setForm(false);
            notify("账目已保存，大家的份额算好啦");
          }}
        />
      )}
      {manual && (
        <Modal title="手动设置参考汇率" onClose={() => setManual(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const nok = Number(f.get("nok")),
                cny = Number(f.get("cny"));
              if (!(
                nok > 0 &&
                cny > 0 &&
                Number.isFinite(nok) &&
                Number.isFinite(cny)
              ))
                return;
              update((x) => ({
                ...x,
                rates: {
                  source: "manual",
                  date: String(f.get("date")),
                  perEUR: { EUR: 1, NOK: nok, CNY: cny },
                },
              }));
              setManual(false);
              notify("手动汇率已保存");
            }}
          >
            <p className="muted">
              输入每 1 欧元可兑换的金额。历史结算单保持原汇率。
            </p>
            <label>
              参考日期
              <input
                type="date"
                name="date"
                required
                defaultValue={s.rates.date}
              />
            </label>
            <label>
              1 EUR = 多少 NOK
              <input
                type="number"
                name="nok"
                step="0.000001"
                min="0.000001"
                required
                defaultValue={s.rates.perEUR.NOK}
              />
            </label>
            <label>
              1 EUR = 多少 CNY
              <input
                type="number"
                name="cny"
                step="0.000001"
                min="0.000001"
                required
                defaultValue={s.rates.perEUR.CNY}
              />
            </label>
            <button className="primary full">保存汇率</button>
          </form>
        </Modal>
      )}
      {showSettlement && snapshot && (
        <Modal
          title="这次旅行，账算清啦"
          onClose={() => setShowSettlement(false)}
        >
          <div className="settle-hero">
            🤝<h3>好朋友，明白账</h3>
            <p>按 {snapshot.currency} 结算 · 汇率与账目已冻结</p>
          </div>
          <div className="info-box">
            {snapshot.rates.source === "demo" ? "演示" : snapshot.rates.source}
            汇率 · {snapshot.rates.date}
            <br />
            生成于{" "}
            {new Date(snapshot.at).toLocaleString("zh-CN", {
              timeZone: "Europe/Oslo",
            })}
            （Oslo）
          </div>
          {Object.entries(
            balances(
              snapshot.expenses,
              snapshot.members,
              snapshot.rates,
              snapshot.currency,
            ),
          ).map(([id, value]) => (
            <div className="balance-row" key={id}>
              <span>
                {ANIMALS[snapshot.members.find((m) => m.id === id)!.animal]}{" "}
                {snapshot.members.find((m) => m.id === id)!.name}
              </span>
              <b className={value >= 0 ? "positive" : ""}>
                {value >= 0 ? "应收" : "应付"}{" "}
                {money(Math.abs(value), snapshot.currency)}
              </b>
            </div>
          ))}
          <h4>转账建议</h4>
          {settle(
            snapshot.expenses,
            snapshot.members,
            snapshot.rates,
            snapshot.currency,
          ).map((t, i) => (
            <div className="transfer" key={i}>
              <span>{snapshot.members.find((m) => m.id === t.from)?.name}</span>
              <ArrowRight size={17} />
              <span>{snapshot.members.find((m) => m.id === t.to)?.name}</span>
              <b>{money(t.amount, snapshot.currency)}</b>
            </div>
          ))}
          {!settle(
            snapshot.expenses,
            snapshot.members,
            snapshot.rates,
            snapshot.currency,
          ).length && <p className="muted">大家的账目已经平衡，无需转账。</p>}
          <p className="fineprint">
            费用均摊后按成员 ID
            分配尾差。建议不保证全局最少转账次数，不发起实际付款。修改账目后请重新生成。
          </p>
        </Modal>
      )}
    </div>
  );
}
function ExpenseForm({
  expense: e,
  day,
  state: s,
  onClose,
  onSave,
}: {
  expense: Expense | null;
  day: number;
  state: State;
  onClose: () => void;
  onSave: (e: Expense) => void;
}) {
  const [participants, setParticipants] = useState(
      e?.participants ?? s.members.map((m) => m.id),
    ),
    [error, setError] = useState("");
  function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const amount = Math.round(Number(f.get("amount")) * 100);
    if (!participants.length) {
      setError("至少选择一名分摊成员");
      return;
    }
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1e12) {
      setError("请输入有效金额");
      return;
    }
    onSave({
      id: e?.id ?? uid(),
      title: String(f.get("title")).trim(),
      day: Number(f.get("day")),
      category: String(f.get("category")),
      amount,
      currency: f.get("currency") as Currency,
      payer: String(f.get("payer")),
      participants,
    });
  }
  return (
    <Modal title={e ? "编辑这笔花费" : "记下一笔小花费"} onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          花在了哪里？
          <input
            name="title"
            required
            maxLength={50}
            defaultValue={e?.title}
            placeholder="例如：港口边的海鲜午餐"
            autoFocus
          />
        </label>
        <div className="form-grid">
          <label>
            金额
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max="1000000000"
              required
              defaultValue={e ? e.amount / 100 : undefined}
              placeholder="0.00"
            />
          </label>
          <label>
            币种
            <select name="currency" defaultValue={e?.currency ?? "NOK"}>
              {["NOK", "EUR", "CNY"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            哪一天
            <select name="day" defaultValue={e?.day ?? day}>
              {[0, 1, 2, 3, 4].map((d) => (
                <option value={d} key={d}>
                  D{d + 1} · {dateFor(s.startDate, d).slice(5)}
                </option>
              ))}
            </select>
          </label>
          <label>
            费用类型
            <select name="category" defaultValue={e?.category ?? "餐饮"}>
              {["餐饮", "交通", "住宿", "景点", "购物", "其他"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          谁先付款？
          <select name="payer" defaultValue={e?.payer ?? "me"}>
            {s.members.map((m) => (
              <option value={m.id} key={m.id}>
                {ANIMALS[m.animal]} {m.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <Users size={14} /> 由谁来均摊？
        </label>
        <div className="participant-options">
          {s.members.map((m) => (
            <button
              type="button"
              className={participants.includes(m.id) ? "chosen" : ""}
              key={m.id}
              onClick={() =>
                setParticipants((p) =>
                  p.includes(m.id)
                    ? p.filter((id) => id !== m.id)
                    : [...p, m.id],
                )
              }
            >
              {ANIMALS[m.animal]} {m.name}
              {participants.includes(m.id) ? " ✓" : ""}
            </button>
          ))}
        </div>
        <small className="muted">只选本人即可记录个人消费。</small>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button className="primary full" style={{ marginTop: 22 }}>
          保存这笔花费
        </button>
      </form>
    </Modal>
  );
}
