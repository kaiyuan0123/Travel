import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Map,
  Compass,
  BookOpen,
  Route,
  Wallet,
  Plus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  Star,
  Check,
  MapPin,
  CalendarDays,
  Users,
  Footprints,
  Flag,
  TrainFront,
  CarFront,
  Plane,
  BedDouble,
  ExternalLink,
  Sparkles,
  Navigation,
  Settings2,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  WifiOff,
  Mountain,
  Leaf,
  Image,
  Menu,
  X,
} from "lucide-react";
import {
  ANIMALS,
  CITIES,
  COLORS,
  DAYS,
  byId,
  places,
  transport,
  freshState,
  type State,
  type City,
  type Item,
  type Source,
} from "./data";
import {
  achievements,
  addItem,
  moveItem,
  dateFor,
  dayItems,
  distance,
  minute,
  optimize,
  reschedule,
  time,
  uid,
  warnings,
} from "./engine";
import { MapView } from "./MapView";
import { locationAdapter, routeFor } from "./adapters";
import { Landmark } from "./illustrations";
import { loadState, saveState } from "./storage";
import { Expenses } from "./Expenses";
import { Report } from "./Report";
import { External, Modal } from "./ui";
type Mode = "plan" | "travel" | "report";
type Tab = "places" | "transport" | "stays" | "expenses";
export default function App() {
  const [state, setState] = useState<State>(freshState),
    [hydrated, setHydrated] = useState(false),
    [saveStatus, setSaveStatus] = useState("正在读取"),
    [mode, setMode] = useState<Mode>("plan"),
    [city, setCity] = useState<City>("oslo"),
    [day, setDay] = useState(0),
    [tab, setTab] = useState<Tab>("places"),
    [selected, setSelected] = useState<string | null>(null),
    [category, setCategory] = useState("全部"),
    [query, setQuery] = useState(""),
    [expanded, setExpanded] = useState(false),
    [drawer, setDrawer] = useState(() => window.innerWidth > 700),
    [modal, setModal] = useState<string | null>(null),
    [editItem, setEditItem] = useState<Item | null>(null),
    [toast, setToast] = useState(""),
    [focus, setFocus] = useState<[number, number] | null>(null),
    [geo, setGeo] = useState(false),
    [position, setPosition] = useState<[number, number] | null>(null),
    [accuracy, setAccuracy] = useState<number | null>(null),
    [online, setOnline] = useState(navigator.onLine),
    [routeProposal, setRouteProposal] = useState<Item[] | null>(null),
    [celebrate, setCelebrate] = useState(false);
  const saveQueue = useRef(Promise.resolve()),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    touchStart = useRef(0);
  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }
  const update = (f: (s: State) => State) => setState(f);
  useEffect(() => {
    loadState()
      .then((s) => {
        setState(s);
        setHydrated(true);
        setSaveStatus("已保存在此设备");
      })
      .catch(() => {
        setHydrated(true);
        setSaveStatus("存储不可用");
        notify("无法读取本地存储，本次编辑可能无法保存");
      });
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    setSaveStatus("正在保存");
    let active = true;
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => saveState(state));
    saveQueue.current
      .then(() => {
        if (active) setSaveStatus("已保存在此设备");
      })
      .catch(() => {
        if (active) {
          setSaveStatus("保存失败");
          notify("本地空间不足或存储不可用，请保留当前页面");
        }
      });
    return () => {
      active = false;
    };
  }, [state, hydrated]);
  useEffect(() => {
    const handler = () => setOnline(navigator.onLine);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);
  useEffect(() => {
    if (mode !== "travel" || !geo) return;
    if (!navigator.geolocation) {
      notify("此浏览器不支持定位，仍可手动或演示打卡");
      setGeo(false);
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        setPosition([p.coords.longitude, p.coords.latitude]);
        setAccuracy(p.coords.accuracy);
      },
      () => {
        notify("未能获取定位，请检查权限；仍可手动打卡");
        setGeo(false);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 },
    );
    const hide = () => {
      if (document.hidden) {
        setGeo(false);
        setPosition(null);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      navigator.geolocation.clearWatch(watch);
      document.removeEventListener("visibilitychange", hide);
      setPosition(null);
      setAccuracy(null);
    };
  }, [mode, geo]);
  function changeMode(m: Mode) {
    setMode(m);
    if (m !== "travel") setGeo(false);
    setModal(null);
  }
  function choose(id: string) {
    setCategory("全部");
    setQuery("");
    setSelected(id);
    setCity(byId[id].city);
    if (mode === "plan") {
      setTab("places");
      setDrawer(true);
    }
  }
  function chooseDay(d: number) {
    setDay(d);
    setCity(d < 3 ? "oslo" : "bergen");
    setSelected(null);
  }
  function add(placeId: string, target = day) {
    try {
      const next = addItem(state.items, placeId, target);
      update((s) => ({ ...s, items: next }));
      notify(`已加入第 ${target + 1} 天，旅程又丰富了一点！`);
    } catch (e) {
      notify((e as Error).message);
    }
  }
  function drop(e: React.DragEvent, target: number) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/roamio");
    try {
      const data = JSON.parse(raw);
      if (data.kind === "place") add(data.id, target);
      else if (data.kind === "item") {
        const item = state.items.find((i) => i.id === data.id);
        if (!item || item.day === target) return;
        const moved = moveItem(state.items, item.id, target);
        update((s) => ({ ...s, items: moved }));
        notify(`已移到第 ${target + 1} 天`);
      }
    } catch (e) {
      if (e instanceof Error) notify(e.message);
    }
  }
  function drag(e: React.DragEvent, kind: string, id: string) {
    e.dataTransfer.setData("application/roamio", JSON.stringify({ kind, id }));
    e.dataTransfer.effectAllowed = "move";
  }
  function reorder(id: string, delta: number) {
    const sorted = dayItems(state.items, day);
    const index = sorted.findIndex((i) => i.id === id),
      other = index + delta;
    if (other < 0 || other >= sorted.length) return;
    [sorted[index], sorted[other]] = [sorted[other], sorted[index]];
    const next = reschedule(sorted);
    if (next.at(-1)!.end > 1440) {
      notify("时间超出当天，请先调整游玩时长");
      return;
    }
    update((s) => ({
      ...s,
      items: [...s.items.filter((i) => i.day !== day), ...next],
    }));
  }
  function checkin(placeId: string, source: Source) {
    if (state.checkins.some((c) => c.placeId === placeId)) {
      notify("这个景点已经点亮啦，去发现下一站吧");
      return;
    }
    if (
      source === "gps" &&
      (!geo || !locationAdapter.eligible(position, accuracy, byId[placeId]))
    ) {
      notify("定位打卡需距离景点 200 米内，且定位误差不超过 100 米");
      return;
    }
    const next = {
      ...state,
      checkins: [
        ...state.checkins,
        { id: uid(), placeId, day, source, at: new Date().toISOString() },
      ],
    };
    const before = new Set(
      achievements(state)
        .filter((a) => a.unlocked)
        .map((a) => a.id),
    );
    const award = achievements(next).find(
      (a) => a.unlocked && !before.has(a.id),
    );
    setState(next);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1800);
    notify(
      award
        ? `🎉 解锁「${award.name}」！${byId[placeId].name}已点亮`
        : `✨ ${byId[placeId].name}已点亮 · ${source === "demo" ? "演示" : source === "gps" ? "定位" : "手动"}记录`,
    );
  }
  useEffect(() => {
    if (selected && tab === "places" && mode === "plan")
      document.getElementById("place-" + selected)?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }, [selected, tab, city, mode]);
  const current = dayItems(state.items, day),
    shown = places.filter(
      (p) =>
        p.city === city &&
        (category === "全部" || p.category === category) &&
        (!query ||
          `${p.name}${p.local}`.toLowerCase().includes(query.toLowerCase())),
    ),
    selectedPlace = selected ? byId[selected] : null,
    issue = warnings(state.items, day),
    badges = achievements(state),
    steps = state.steps[day],
    nextPlace =
      selectedPlace ??
      (current.find((i) => !state.checkins.some((c) => c.placeId === i.placeId))
        ? byId[
            current.find(
              (i) => !state.checkins.some((c) => c.placeId === i.placeId),
            )!.placeId
          ]
        : current[0]
          ? byId[current[0].placeId]
          : byId[city === "oslo" ? "opera" : "bryggen"]);
  const routeDistance = current
    .slice(1)
    .reduce(
      (sum, i, index) =>
        sum +
        distance(
          byId[current[index].placeId].coordinates,
          byId[i.placeId].coordinates,
        ),
      0,
    );
  const routeDetails = routeFor(current);
  if (!hydrated)
    return (
      <div className="boot-screen">
        <img src="/icon.svg" />
        <h2>漫游搭子</h2>
        <p>正在打开你的旅行地图…</p>
      </div>
    );
  return (
    <div className={"app mode-" + mode}>
      <header className="app-header">
        <button className="brand" onClick={() => changeMode("plan")}>
          <img src="/icon.svg" />
          <span>
            漫游搭子
            <small>
              roamio<span className="brand-dot">.</span>
            </small>
          </span>
        </button>
        <nav className="mode-nav" aria-label="主要导航">
          {(
            [
              { id: "plan", label: "规划旅程", icon: Map },
              { id: "travel", label: "旅行打卡", icon: Compass },
              { id: "report", label: "旅行回忆", icon: BookOpen },
            ] as const
          ).map((n) => (
            <button
              className={mode === n.id ? "active" : ""}
              key={n.id}
              onClick={() => changeMode(n.id)}
            >
              <n.icon size={17} />
              <span>{n.label}</span>
              {mode === n.id && <i />}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <span className="prototype-tag">探索体验版</span>
          <button
            className="help-btn"
            title="使用说明"
            onClick={() => setModal("help")}
          >
            ?
          </button>
          <button
            className="profile-avatar"
            onClick={() => setModal("members")}
            title="修改我的头像"
          >
            {ANIMALS[state.members[0].animal]}
          </button>
        </div>
      </header>
      <div className="trip-header">
        <div className="trip-heading">
          <span className="country-flag">🇳🇴</span>
          <div>
            <span className="breadcrumb">
              我的旅行 <ChevronRight size={11} /> NORWAY
            </span>
            <button onClick={() => setModal("trip")}>
              <h1>{state.title}</h1>
              <ChevronDown size={16} />
            </button>
          </div>
          <span className="trip-pill">5 天 · 2 座城市</span>
        </div>
        <div className="trip-actions">
          <span
            className={
              "save-indicator " +
              (saveStatus === "保存失败" ? "error-text" : "")
            }
          >
            <span className="live-dot" />
            {online ? saveStatus : "离线 · " + saveStatus}
          </span>
          <button className="date-button" onClick={() => setModal("trip")}>
            <CalendarDays size={15} />
            <span>
              {dateFor(state.startDate, 0).slice(5).replace("-", "月")}日 —{" "}
              {dateFor(state.startDate, 4).slice(5).replace("-", "月")}日
            </span>
          </button>
          <button
            className="member-stack"
            onClick={() => setModal("members")}
            aria-label="查看旅行伙伴"
          >
            {state.members.map((m) => (
              <span key={m.id}>{ANIMALS[m.animal]}</span>
            ))}
          </button>
          <button className="invite-btn" onClick={() => setModal("invite")}>
            <Users size={15} />
            <span>邀请搭子</span>
            <Plus size={14} />
          </button>
        </div>
      </div>
      {mode === "report" ? (
        <Report state={state} update={update} notify={notify} />
      ) : (
        <div
          className={
            "workspace " +
            (mode === "travel" ? "travelling" : "") +
            (expanded ? " timeline-expanded" : "")
          }
        >
          <section className="map-section" aria-label="旅行地图">
            <MapView
              city={city}
              selected={selected}
              select={choose}
              items={state.items}
              day={day}
              checkins={state.checkins}
              members={state.members}
              travel={mode === "travel"}
              transit={tab === "transport"}
              focus={focus}
              position={position}
            />
            <div className="city-toolbar">
              <div className="city-switch">
                {(["oslo", "bergen"] as City[]).map((c) => (
                  <button
                    className={city === c ? "active" : ""}
                    key={c}
                    onClick={() => {
                      setCity(c);
                      setSelected(null);
                      setCategory("全部");
                      setQuery("");
                    }}
                  >
                    <MapPin size={14} />
                    {CITIES[c].name}
                    <small>{CITIES[c].local}</small>
                  </button>
                ))}
              </div>
              <button
                className="round-button mobile-panel-toggle"
                aria-label="打开或收起详情"
                onClick={() => setDrawer(!drawer)}
              >
                {drawer ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
            <div className="map-heading">
              <span className="map-eyebrow">LET CURIOSITY LEAD THE WAY</span>
              <h2>
                {city === "oslo"
                  ? "在奥斯陆，遇见小美好"
                  : "在卑尔根，把山海收藏"}
                <span>✦</span>
              </h2>
              <p>
                {city === "oslo"
                  ? "峡湾、艺术，和一场不赶时间的漫步。"
                  : "彩色木屋、山间微风，下一站都是惊喜。"}
              </p>
            </div>
            <div className="map-legend">
              <span style={{ background: COLORS[day] }} />第 {day + 1} 天路线
              <small>· 示意连线，非导航</small>
            </div>
            {mode === "plan" && (
              <div className="explore-tip">
                <span>🦊</span>
                <div>
                  <b>你的下一段故事，从这里开始</b>
                  <small>点点地图上的小地标，或把景点拖进下方行程</small>
                </div>
                <Sparkles size={20} />
              </div>
            )}
            {mode === "travel" && (
              <div
                className="travel-note"
                onTouchStart={(e) => {
                  touchStart.current = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  const delta =
                    e.changedTouches[0].clientX - touchStart.current;
                  if (Math.abs(delta) > 60)
                    chooseDay(
                      Math.min(4, Math.max(0, day + (delta < 0 ? 1 : -1))),
                    );
                }}
              >
                <div className="note-tape" />
                <div className="note-title">
                  <span>今天也要好好玩 ☀</span>
                  <span className="demo-tag">同行位置为模拟</span>
                </div>
                <div className="note-date">
                  <button
                    aria-label="前一天"
                    disabled={day === 0}
                    onClick={() => chooseDay(day - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div>
                    <strong>DAY {day + 1}</strong>
                    <small>
                      {dateFor(state.startDate, day)} · {DAYS[day]}
                    </small>
                  </div>
                  <button
                    aria-label="后一天"
                    disabled={day === 4}
                    onClick={() => chooseDay(day + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="note-itinerary">
                  {current.map((i) => {
                    const done = state.checkins.find(
                      (c) => c.placeId === i.placeId,
                    );
                    return (
                      <button
                        className={selected === i.placeId ? "active" : ""}
                        key={i.id}
                        onClick={() => choose(i.placeId)}
                      >
                        <span
                          className={"note-check " + (done ? "checked" : "")}
                        >
                          {done ? <Check size={12} /> : <span />}
                        </span>
                        <div>
                          <b>{byId[i.placeId].name}</b>
                          <small>
                            {time(i.start)} — {time(i.end)}{" "}
                            {done
                              ? `· ${done.source === "demo" ? "演示" : done.source === "gps" ? "定位" : "手动"}打卡`
                              : ""}
                          </small>
                        </div>
                        <ChevronRight size={13} />
                      </button>
                    );
                  })}
                  {!current.length && (
                    <p className="muted">今天没有景点安排，随心探索也很好。</p>
                  )}
                </div>
                <div className="checkin-target">
                  <span>下一枚足迹</span>
                  <b>{nextPlace.name}</b>
                </div>
                <button
                  className="primary full"
                  onClick={() => checkin(nextPlace.id, "demo")}
                >
                  <Flag size={16} />
                  模拟抵达 · 点亮这里
                </button>
                <div className="checkin-actions">
                  <button onClick={() => checkin(nextPlace.id, "manual")}>
                    手动记录到访
                  </button>
                  <button onClick={() => checkin(nextPlace.id, "gps")}>
                    定位打卡
                  </button>
                </div>
                <div className="location-control">
                  <button
                    className={geo ? "enabled" : ""}
                    onClick={() => setGeo(!geo)}
                  >
                    <Navigation size={14} />
                    {geo ? "关闭前台定位" : "开启前台定位"}
                  </button>
                  {geo && (
                    <small>
                      {accuracy !== null
                        ? `定位误差约 ${Math.round(accuracy)} 米`
                        : "正在定位…"}
                    </small>
                  )}
                </div>
                <div
                  className="steps-card"
                  onClick={() => setModal("steps")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setModal("steps");
                  }}
                >
                  <span>👟</span>
                  <div>
                    <b>
                      {steps?.value.toLocaleString() ?? "0"} <small>步</small>
                    </b>
                    <small>
                      {steps
                        ? steps.source === "demo"
                          ? "演示步数"
                          : "手动记录"
                        : "记录今天的步数"}
                    </small>
                  </div>
                  <Plus size={16} />
                </div>
                <p className="fineprint">
                  模拟抵达和手动记录不验证实际到访；定位仅在前台开启时运行。
                </p>
              </div>
            )}
            {mode === "plan" && (
              <div className={"timeline " + (expanded ? "expanded" : "")}>
                <div className="timeline-heading">
                  <div>
                    <Route size={17} />
                    <b>我的五日漫游</b>
                    <span>{state.items.length} 个安排</span>
                    {issue.length > 0 && (
                      <button
                        className="issue-pill"
                        onClick={() => setExpanded(true)}
                      >
                        {issue.length} 处提醒
                      </button>
                    )}
                  </div>
                  <button
                    className="text-btn"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? "收起" : "展开行程"}
                    {expanded ? (
                      <ChevronDown size={15} />
                    ) : (
                      <ChevronUp size={15} />
                    )}
                  </button>
                </div>
                <div className="day-tabs">
                  {[0, 1, 2, 3, 4].map((d) => (
                    <button
                      key={d}
                      className={day === d ? "active" : ""}
                      style={
                        { "--day-color": COLORS[d] } as React.CSSProperties
                      }
                      onClick={() => chooseDay(d)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("drop-over");
                      }}
                      onDragLeave={(e) =>
                        e.currentTarget.classList.remove("drop-over")
                      }
                      onDrop={(e) => {
                        e.currentTarget.classList.remove("drop-over");
                        drop(e, d);
                        chooseDay(d);
                      }}
                    >
                      <span className="day-circle">{d + 1}</span>
                      <div>
                        <b>
                          DAY {d + 1}{" "}
                          <small>
                            {dateFor(state.startDate, d)
                              .slice(5)
                              .replace("-", "/")}
                          </small>
                        </b>
                        <small>{DAYS[d]}</small>
                      </div>
                      <span className="day-count">
                        {dayItems(state.items, d).length}
                      </span>
                    </button>
                  ))}
                </div>
                <div
                  className="timeline-content"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => drop(e, day)}
                >
                  {day === 2 && (
                    <div className="transfer-card">
                      <TrainFront size={24} />
                      <div>
                        <b>Oslo → Bergen · 沿途都是风景</b>
                        <small>跨城交通待安排，时刻及票价请查看运营商。</small>
                        <External href="https://www.vy.no/en">
                          查询 Vy 火车
                        </External>
                      </div>
                    </div>
                  )}
                  <div className="itinerary-cards">
                    {current.map((i, index) => (
                      <div
                        key={i.id}
                        className={
                          "itinerary-card " +
                          (selected === i.placeId ? "active" : "")
                        }
                        draggable
                        onDragStart={(e) => drag(e, "item", i.id)}
                      >
                        <span
                          className="itinerary-order"
                          style={{ background: COLORS[day] }}
                        >
                          {index + 1}
                        </span>
                        <button
                          className="itinerary-main"
                          onClick={() => {
                            setEditItem(i);
                            choose(i.placeId);
                          }}
                        >
                          <b>{byId[i.placeId].name}</b>
                          <small>
                            <Clock size={11} />
                            {time(i.start)} — {time(i.end)}
                          </small>
                        </button>
                        <div className="itinerary-tools">
                          <button
                            aria-label={`将${byId[i.placeId].name}提前`}
                            disabled={index === 0}
                            onClick={() => reorder(i.id, -1)}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            aria-label={`将${byId[i.placeId].name}后移`}
                            disabled={index === current.length - 1}
                            onClick={() => reorder(i.id, 1)}
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                        <GripVertical size={13} className="grip" />
                      </div>
                    ))}
                    <button
                      className="add-itinerary"
                      onClick={() => {
                        setTab("places");
                        setDrawer(true);
                        notify("选择一个喜欢的景点，点击加号或拖入这一天");
                      }}
                    >
                      <Plus size={18} />
                      <span>添加心动地点</span>
                    </button>
                  </div>
                  {expanded && (
                    <div className="expanded-info">
                      <span>
                        <Route size={14} />
                        景点间直线距离 {Math.round(routeDistance / 100) / 10} km
                        · 耗时仅为步行估算
                      </span>
                      <button
                        className="text-btn"
                        disabled={current.length < 3}
                        onClick={() => setRouteProposal(optimize(current))}
                      >
                        <Sparkles size={13} />
                        看看顺路建议
                      </button>
                    </div>
                  )}
                  {expanded && issue.length > 0 && (
                    <div className="schedule-warnings">
                      {issue.map((w) => (
                        <span key={w}>⚑ {w}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="timeline-footer">
                  <span>
                    <span className="tiny-dot" />
                    把景点拖入日期，自由安排每一天
                  </span>
                  <span>当地时间 · Europe/Oslo</span>
                </div>
              </div>
            )}
          </section>
          {mode === "plan" && (
            <aside className={"detail-panel " + (drawer ? "drawer-open" : "")}>
              <div className="detail-tabs" role="tablist" aria-label="旅行内容">
                {(
                  [
                    { id: "places", icon: MapPin, label: "景点" },
                    { id: "transport", icon: TrainFront, label: "交通" },
                    { id: "stays", icon: BedDouble, label: "住宿" },
                    { id: "expenses", icon: Wallet, label: "费用" },
                  ] as const
                ).map((t) => (
                  <button
                    role="tab"
                    aria-selected={tab === t.id}
                    className={tab === t.id ? "active" : ""}
                    key={t.id}
                    onClick={() => setTab(t.id)}
                  >
                    <t.icon size={18} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="detail-scroll">
                {tab === "places" ? (
                  <>
                    <div className="section-eyebrow">
                      A LITTLE CURIOUS, A LOT OF FUN
                    </div>
                    <div className="panel-title">
                      <h2>
                        下一站，心动。
                        <span>
                          探索{CITIES[city].name}的{" "}
                          {places.filter((p) => p.city === city).length}{" "}
                          个好去处
                        </span>
                      </h2>
                      <span className="title-sticker">✦</span>
                    </div>
                    <div className="search-box">
                      <Search size={16} />
                      <input
                        aria-label="搜索景点"
                        placeholder="搜索一个心动的地方"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      {query && (
                        <button
                          onClick={() => setQuery("")}
                          aria-label="清除搜索"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="category-chips">
                      {[
                        "全部",
                        "自然",
                        "艺术",
                        "历史",
                        "建筑",
                        "城市",
                        "美食",
                      ].map((c) => (
                        <button
                          key={c}
                          onClick={() => setCategory(c)}
                          className={category === c ? "active" : ""}
                        >
                          {c === "自然" && <Leaf size={11} />} {c}
                        </button>
                      ))}
                    </div>
                    <div className="result-meta">
                      <span>{shown.length} 个值得出发的理由</span>
                      <small>
                        <Star size={11} />
                        编辑精选
                      </small>
                    </div>
                    <div className="place-list">
                      {shown.map((p, index) => {
                        const scheduled = state.items.find(
                          (i) => i.placeId === p.id && i.day === day,
                        );
                        return (
                          <article
                            id={"place-" + p.id}
                            key={p.id}
                            className={
                              "place-card " +
                              (selected === p.id ? "selected" : "") +
                              (index === 0 ? " featured" : "")
                            }
                            draggable
                            onDragStart={(e) => drag(e, "place", p.id)}
                          >
                            <button
                              className="place-art"
                              style={{ background: p.color }}
                              onClick={() => choose(p.id)}
                              aria-label={`在地图上查看${p.name}`}
                            >
                              <Landmark kind={p.icon} color={p.color} />
                              {index === 0 && (
                                <span className="pick-tag">
                                  <Sparkles size={10} />
                                  第一次来必看
                                </span>
                              )}
                              <span className="rating">
                                <Star size={10} fill="currentColor" />
                                {p.rating}
                              </span>
                            </button>
                            <div className="place-body">
                              <button
                                className="place-name"
                                onClick={() => choose(p.id)}
                              >
                                <h3>{p.name}</h3>
                                <small>{p.local}</small>
                              </button>
                              <p>{p.description}</p>
                              <div className="place-meta">
                                <span>{p.category}</span>
                                <small>
                                  <Clock size={11} />
                                  {p.duration >= 60
                                    ? `${p.duration / 60} 小时`
                                    : `${p.duration} 分钟`}
                                </small>
                                <button
                                  className={
                                    "add-place " + (scheduled ? "added" : "")
                                  }
                                  aria-label={
                                    scheduled
                                      ? `${p.name}已加入当天`
                                      : `将${p.name}加入第${day + 1}天`
                                  }
                                  onClick={() => add(p.id)}
                                  disabled={!!scheduled}
                                >
                                  {scheduled ? (
                                    <Check size={17} />
                                  ) : (
                                    <Plus size={17} />
                                  )}
                                </button>
                              </div>
                              {selected === p.id && (
                                <div className="place-source">
                                  <a
                                    href={p.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    介绍参考 · 官方旅游局{" "}
                                    <ExternalLink size={10} />
                                  </a>
                                  <small>推荐指数为编辑推荐，非平台评分</small>
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })}
                      {!shown.length && (
                        <div className="empty-state">
                          <Search />
                          <p>还没找到这个地方，换个关键词试试。</p>
                          <button
                            className="text-btn"
                            onClick={() => {
                              setQuery("");
                              setCategory("全部");
                            }}
                          >
                            查看全部景点
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="panel-footnote">
                      慢一点，也许会发现更多。<span>✧</span>
                    </div>
                  </>
                ) : tab === "transport" ? (
                  <>
                    <div className="section-eyebrow">
                      THE JOURNEY IS PART OF THE TRIP
                    </div>
                    <div className="panel-title">
                      <h2>
                        沿途，也很美<span>从一份期待，抵达下一份惊喜</span>
                      </h2>
                      <span className="title-sticker">🚂</span>
                    </div>
                    <div className="transport-hero">
                      <Landmark kind="mountain" />
                      <h3>穿过山谷，去看海</h3>
                      <p>Oslo → Bergen · 挪威双城慢旅行</p>
                      <External href="https://www.vy.no/en">
                        查看跨城火车
                      </External>
                    </div>
                    <h3 className="subheading">
                      <Route size={17} />第 {day + 1} 天的路线
                    </h3>
                    <p className="muted">
                      {current.length} 个景点 · 直线距离{" "}
                      {(routeDistance / 1000).toFixed(1)} km
                    </p>
                    {current.length > 1 ? (
                      <div className="route-stops">
                        {current.map((i, n) => (
                          <div key={i.id}>
                            <span style={{ background: COLORS[day] }}>
                              {n + 1}
                            </span>
                            <button onClick={() => choose(i.placeId)}>
                              {byId[i.placeId].name}
                            </button>
                            {n > 0 && (
                              <small>
                                上一站约 {routeDetails.minutes[n - 1]} 分钟
                                {routeDetails.source === "demo"
                                  ? " · 预制示例耗时"
                                  : " · 步行估算"}
                              </small>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">
                        安排至少两个景点，即可查看路线示意。
                      </p>
                    )}
                    <button
                      className="secondary full"
                      disabled={current.length < 3}
                      onClick={() => setRouteProposal(optimize(current))}
                    >
                      <Sparkles size={15} />
                      预览顺路建议
                    </button>
                    <p className="fineprint">
                      按地理距离提供顺序建议，不考虑道路、渡轮和开放时间；地图连线与耗时均非实时导航。
                    </p>
                    <h3 className="subheading">租一辆车，随心出发</h3>
                    <div className="provider-grid">
                      {[
                        ["Hertz", "https://www.hertz.com/"],
                        ["Avis", "https://www.avis.com/"],
                        ["Sixt", "https://www.sixt.com/"],
                        ["Rentalcars", "https://www.rentalcars.com/"],
                      ].map(([name, href]) => (
                        <External key={name} href={href}>
                          {name}
                        </External>
                      ))}
                    </div>
                    <h3 className="subheading">
                      <TrainFront size={17} />
                      机场与火车站
                    </h3>
                    {transport
                      .filter((t) => t.city === city)
                      .map((t) => (
                        <button
                          key={t.name}
                          className="station-row"
                          onClick={() => setFocus([...t.coordinates])}
                        >
                          {t.type === "airport" ? (
                            <Plane size={19} />
                          ) : (
                            <TrainFront size={19} />
                          )}
                          <span>{t.name}</span>
                          <MapPin size={15} />
                        </button>
                      ))}
                    <External href="https://entur.no/">
                      Entur 挪威公共交通查询
                    </External>
                  </>
                ) : tab === "stays" ? (
                  <>
                    <div className="section-eyebrow">
                      A LITTLE HOME, FAR FROM HOME
                    </div>
                    <div className="panel-title">
                      <h2>
                        今晚，住进好梦<span>挑一个喜欢的地方，安心歇脚</span>
                      </h2>
                      <span className="title-sticker">🌙</span>
                    </div>
                    <div className="stay-illustration">
                      <Landmark kind="houses" />
                      <span>让每一晚，也成为旅行的一部分。</span>
                    </div>
                    <h3 className="subheading">
                      <BedDouble size={18} />
                      酒店与舒适小屋
                    </h3>
                    <p className="muted">
                      前往你熟悉的平台，寻找{CITIES[city].name}的落脚点。
                    </p>
                    <div className="stay-providers">
                      {[
                        [
                          "Booking.com",
                          "缤客 · 找一家喜欢的酒店",
                          "https://www.booking.com/",
                          "#e6edf8",
                        ],
                        [
                          "Trip.com",
                          "携程 · 熟悉的预订体验",
                          "https://www.trip.com/",
                          "#e6f0fa",
                        ],
                        [
                          "Agoda",
                          "雅高达 · 多一点选择",
                          "https://www.agoda.com/",
                          "#f7eee1",
                        ],
                      ].map(([name, desc, href, bg]) => (
                        <a
                          key={name}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ background: bg }}
                        >
                          <strong>{name}</strong>
                          <span>{desc}</span>
                          <ExternalLink size={16} />
                        </a>
                      ))}
                    </div>
                    <h3 className="subheading">像当地人一样住下来</h3>
                    <a
                      className="airbnb-card"
                      href="https://www.airbnb.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>⌂</span>
                      <div>
                        <b>Airbnb</b>
                        <small>木屋、公寓，和属于你的日常</small>
                      </div>
                      <ArrowRight size={17} />
                    </a>
                    <p className="info-box">
                      这些是预订平台入口。房价、空房及预订条款以平台显示为准；原型不提供实时比价。
                    </p>
                  </>
                ) : (
                  <Expenses
                    state={state}
                    update={update}
                    notify={notify}
                    day={day}
                  />
                )}
              </div>
            </aside>
          )}
        </div>
      )}
      <footer className="app-footer">
        <span>
          <Mountain size={12} />
          每一小步，都是新的发现。
        </span>
        <span>
          本地保存 · {online ? "在线地图" : "离线模式"}{" "}
          <span className="footer-dot">·</span> 用好奇心丈量世界 <span>✦</span>
        </span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {celebrate && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 20 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${10 + i * 4}%`,
                background: COLORS[i % 5],
                animationDelay: `${(i % 5) * 0.06}s`,
                transform: `rotate(${i * 27}deg)`,
              }}
            />
          ))}
        </div>
      )}
      {modal === "invite" && (
        <Modal title="好风景，要和搭子一起看" onClose={() => setModal(null)}>
          <div className="invite-art">
            {state.members.map((m) => (
              <span key={m.id}>{ANIMALS[m.animal]}</span>
            ))}
            <span>＋</span>
          </div>
          <p>一起安排路线、记录花费，再把回忆装进同一段旅程。</p>
          <div className="info-box">
            <b>邀请流程演示</b>
            <p>
              当前版本仅保存在你的浏览器，不会发送邀请或同步到其他设备。地图上的同行者位置也是模拟数据。
            </p>
          </div>
          <button className="primary full" onClick={() => setModal("members")}>
            <Users size={17} />
            编辑这次旅行的伙伴
          </button>
        </Modal>
      )}
      {modal === "members" && (
        <Members
          state={state}
          update={update}
          onClose={() => setModal(null)}
          notify={notify}
        />
      )}
      {modal === "trip" && (
        <Modal title="给这段旅程起个名字" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const title = String(f.get("title")).trim();
              if (!title) {
                notify("给旅程起一个名字吧");
                return;
              }
              update((s) => ({
                ...s,
                title,
                startDate: String(f.get("startDate")),
              }));
              setModal(null);
              notify("旅行信息已更新");
            }}
          >
            <label>
              旅行名称
              <input
                name="title"
                maxLength={24}
                required
                defaultValue={state.title}
              />
            </label>
            <label>
              出发日期
              <input
                type="date"
                name="startDate"
                min="2000-01-01"
                max="2099-12-27"
                required
                defaultValue={state.startDate}
              />
            </label>
            <div className="info-box">
              五日样例：Oslo 两天 → 第三天跨城 → Bergen 两天。所有游览时间以
              Europe/Oslo 为准。
            </div>
            <button className="primary full">保存旅行信息</button>
          </form>
        </Modal>
      )}
      {modal === "steps" && (
        <Modal title="今天，又走了多少风景？" onClose={() => setModal(null)}>
          <div className="steps-hero">👟</div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const value = Number(f.get("steps"));
              if (!Number.isSafeInteger(value) || value < 0 || value > 200000)
                return;
              update((s) => ({
                ...s,
                steps: { ...s.steps, [day]: { value, source: "manual" } },
              }));
              setModal(null);
              notify(
                value >= 20000
                  ? "🎉 健步如飞！今天的脚步值得一枚徽章"
                  : "今天的步数已手动记录",
              );
            }}
          >
            <label>
              第 {day + 1} 天 · 手动步数
              <input
                type="number"
                name="steps"
                min="0"
                max="200000"
                step="1"
                required
                defaultValue={steps?.value ?? 0}
              />
            </label>
            <p className="muted">
              原型未连接健康应用，步数由你手动记录，或使用演示数据体验成就。
            </p>
            <button className="primary full">
              <Footprints size={16} />
              保存手动记录
            </button>
            <button
              type="button"
              className="secondary full"
              onClick={() => {
                update((s) => ({
                  ...s,
                  steps: {
                    ...s.steps,
                    [day]: { value: 20000, source: "demo" },
                  },
                }));
                setModal(null);
                notify("👟 已记录 20,000 演示步数，解锁健步如飞");
              }}
            >
              体验 20,000 步演示成就
            </button>
          </form>
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="把世界，变成你的旅行地图" onClose={() => setModal(null)}>
          <div className="help-steps">
            {[
              [
                "1",
                "规划旅程",
                "点击地图地标或景点卡片，加入日期；拖动卡片可以跨日安排，点击行程可编辑起止时间。",
              ],
              [
                "2",
                "旅行打卡",
                "切到旅行模式，模拟抵达体验成就；也可以手动记录，或主动开启前台定位。",
              ],
              [
                "3",
                "留下回忆",
                "费用页记录付款和均摊；旅行回忆页上传照片，导出你的专属旅行明信片。",
              ],
            ].map(([n, title, text]) => (
              <div key={n}>
                <span>{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="info-box">
            体验版数据仅保存在当前浏览器。无真实邀请、多人同步、后台定位或自动步数。地图需要联网，已缓存的界面与本地行程可以离线使用。
          </p>
        </Modal>
      )}
      {editItem && (
        <Modal title="给这一站，留一点时间" onClose={() => setEditItem(null)}>
          <div className="item-edit-heading">
            <Landmark kind={byId[editItem.placeId].icon} />
            <div>
              <h3>{byId[editItem.placeId].name}</h3>
              <p>{byId[editItem.placeId].local}</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const start = minute(String(f.get("start"))),
                end = minute(String(f.get("end"))),
                target = Number(f.get("day"));
              if (end <= start) {
                notify("结束时间需要晚于开始时间");
                return;
              }
              if (
                state.items.some(
                  (i) =>
                    i.id !== editItem.id &&
                    i.placeId === editItem.placeId &&
                    i.day === target,
                )
              ) {
                notify("目标日期已经安排了这个景点");
                return;
              }
              update((s) => ({
                ...s,
                items: s.items.map((i) =>
                  i.id === editItem.id ? { ...i, day: target, start, end } : i,
                ),
              }));
              setEditItem(null);
              chooseDay(target);
              notify("行程已更新，记得给路途留点时间");
            }}
          >
            <label>
              哪一天出发
              <select name="day" defaultValue={editItem.day}>
                {[0, 1, 2, 3, 4].map((d) => (
                  <option value={d} key={d}>
                    DAY {d + 1} · {DAYS[d]}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label>
                开始时间
                <input
                  type="time"
                  name="start"
                  required
                  defaultValue={time(editItem.start)}
                />
              </label>
              <label>
                结束时间
                <input
                  type="time"
                  name="end"
                  required
                  defaultValue={time(editItem.end)}
                />
              </label>
            </div>
            <p className="muted">
              建议游玩 {byId[editItem.placeId].duration} 分钟。以当地时间记录。
            </p>
            <button className="primary full">保存这站安排</button>
            <button
              type="button"
              className="danger-btn full"
              onClick={() => {
                update((s) => ({
                  ...s,
                  items: s.items.filter((i) => i.id !== editItem.id),
                }));
                setEditItem(null);
                notify("已从行程移除，随时可以再加入");
              }}
            >
              <Trash2 size={14} />
              从行程中移除
            </button>
          </form>
        </Modal>
      )}
      {routeProposal && (
        <Modal
          title="这样走，也许更顺路"
          onClose={() => setRouteProposal(null)}
        >
          <p className="muted">
            固定第一站，按距离建议后续顺序。应用后从原开始时间排起，每站间留 30
            分钟。
          </p>
          <ol className="proposal-list">
            {routeProposal.map((i) => (
              <li key={i.id}>{byId[i.placeId].name}</li>
            ))}
          </ol>
          <div className="info-box">
            基于地理距离，不含道路、公共交通和开放时间。请自行确认实际可行性。
          </div>
          <button
            className="primary full"
            onClick={() => {
              const next = reschedule(routeProposal, current[0]?.start);
              if (next.at(-1)!.end > 1440) {
                notify("推荐排程超出当天，请先缩短游玩时长");
                return;
              }
              update((s) => ({
                ...s,
                items: [...s.items.filter((i) => i.day !== day), ...next],
              }));
              setRouteProposal(null);
              notify("顺路建议已应用，可继续修改每一站时间");
            }}
          >
            应用这个顺序
          </button>
        </Modal>
      )}
    </div>
  );
}
function Members({
  state: s,
  update,
  onClose,
  notify,
}: {
  state: State;
  update: (f: (s: State) => State) => void;
  onClose: () => void;
  notify: (s: string) => void;
}) {
  const [members, setMembers] = useState(s.members);
  return (
    <Modal title="搭子集合，各有可爱" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (members.some((m) => !m.name.trim())) return;
          update((s) => ({
            ...s,
            members: members.map((m) => ({ ...m, name: m.name.trim() })),
          }));
          onClose();
          notify("搭子们已经准备好出发啦");
        }}
      >
        <p className="muted">
          选一只动物，陪你在地图上慢慢探索。同行成员为本地演示角色。
        </p>
        {members.map((m, index) => (
          <div className="member-editor" key={m.id}>
            <div>
              <span className="member-big-avatar">{ANIMALS[m.animal]}</span>
              <label>
                {index === 0 ? "我的昵称" : "搭子昵称"}
                <input
                  required
                  maxLength={12}
                  value={m.name}
                  onChange={(e) =>
                    setMembers((ms) =>
                      ms.map((v) =>
                        v.id === m.id ? { ...v, name: e.target.value } : v,
                      ),
                    )
                  }
                />
              </label>
            </div>
            <div className="animal-options">
              {ANIMALS.map((a, i) => (
                <button
                  type="button"
                  aria-label={`${m.name}选择头像${i + 1}`}
                  aria-pressed={m.animal === i}
                  className={m.animal === i ? "chosen" : ""}
                  key={a}
                  onClick={() =>
                    setMembers((ms) =>
                      ms.map((v) => (v.id === m.id ? { ...v, animal: i } : v)),
                    )
                  }
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button className="primary full">
          就这样，出发！
          <ArrowRight size={16} />
        </button>
      </form>
    </Modal>
  );
}
