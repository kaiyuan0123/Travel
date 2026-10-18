import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Download,
  Shuffle,
  ImagePlus,
  Footprints,
  MapPin,
  Flag,
} from "lucide-react";
import { achievements, convert, dateFor, money } from "./engine";
import { byId } from "./data";
import type { StoreProps } from "./Expenses";
import { preparePhoto } from "./storage";
export function Report({ state: s, update, notify }: StoreProps) {
  const canvas = useRef<HTMLCanvasElement>(null),
    file = useRef<HTMLInputElement>(null),
    [badge, setBadge] = useState(0),
    [busy, setBusy] = useState(false);
  const unlocked = achievements(s).filter((a) => a.unlocked),
    unique = new Set(s.checkins.map((c) => c.placeId)),
    cities = new Set([...unique].map((id) => byId[id].city)),
    steps = Object.values(s.steps).reduce((n, v) => n + v.value, 0),
    total = s.expenses.reduce(
      (n, e) => n + convert(e.amount, e.currency, "CNY", s.rates),
      0,
    );
  const award = unlocked[badge % Math.max(1, unlocked.length)];
  useEffect(() => {
    let cancelled = false;
    async function draw() {
      const c = canvas.current!;
      const ctx = c.getContext("2d")!;
      c.width = 900;
      c.height = 1180;
      const themes = [
        ["#fcf9ed", "#226a56", "#e8b35c"],
        ["#edf4f7", "#477e9c", "#8cb6c7"],
        ["#f9eeea", "#a65e53", "#d6a09a"],
      ];
      const [bg, ink, accent] = themes[s.frame];
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 900, 1180);
      ctx.fillStyle = ink;
      ctx.font = "bold 20px system-ui";
      ctx.fillText("ROAMIO  /  漫游搭子", 58, 65);
      ctx.textAlign = "right";
      ctx.font = "18px system-ui";
      ctx.fillText("NORWAY · TRAVEL JOURNAL", 842, 65);
      ctx.textAlign = "left";
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(40, 95, 820, 660, 12);
      ctx.clip();
      ctx.fillStyle = s.frame === 1 ? "#c0dbe2" : "#d6e0cf";
      ctx.fillRect(40, 95, 820, 660);
      if (s.photo) {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = s.photo!;
        });
        if (cancelled) return;
        const scale = Math.max(820 / img.width, 660 / img.height) * s.crop.zoom;
        const w = img.width * scale,
          h = img.height * scale;
        ctx.drawImage(
          img,
          40 + ((820 - w) * s.crop.x) / 100,
          95 + ((660 - h) * s.crop.y) / 100,
          w,
          h,
        );
      } else {
        const grad = ctx.createLinearGradient(0, 100, 0, 760);
        grad.addColorStop(0, "#c1dde0");
        grad.addColorStop(0.7, "#e9e9d4");
        grad.addColorStop(1, "#99bdbe");
        ctx.fillStyle = grad;
        ctx.fillRect(40, 95, 820, 660);
        ctx.fillStyle = "#7d9f90";
        ctx.beginPath();
        ctx.moveTo(40, 530);
        ctx.lineTo(270, 240);
        ctx.lineTo(480, 500);
        ctx.lineTo(690, 220);
        ctx.lineTo(860, 490);
        ctx.lineTo(860, 755);
        ctx.lineTo(40, 755);
        ctx.fill();
        ctx.fillStyle = "#a9c4b0";
        ctx.beginPath();
        ctx.moveTo(40, 630);
        ctx.lineTo(410, 360);
        ctx.lineTo(680, 640);
        ctx.lineTo(860, 470);
        ctx.lineTo(860, 755);
        ctx.lineTo(40, 755);
        ctx.fill();
        ctx.fillStyle = "#f9e7ac";
        ctx.beginPath();
        ctx.arc(680, 245, 55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.82)";
        ctx.font = "24px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("把你最喜欢的风景，放在这里", 450, 693);
        ctx.textAlign = "left";
      }
      ctx.restore();
      ctx.fillStyle = ink;
      ctx.font = "bold 48px system-ui";
      ctx.fillText(s.title.slice(0, 16), 58, 835);
      ctx.font = "21px system-ui";
      ctx.fillText(
        `${dateFor(s.startDate, 0).replaceAll("-", ".")} — ${dateFor(s.startDate, 4).replaceAll("-", ".")}    OSLO + BERGEN`,
        58,
        880,
      );
      ctx.fillStyle = accent;
      ctx.fillRect(58, 918, 784, 2);
      const stats = [
        `${cities.size} 座城市`,
        `${unique.size} 个足迹`,
        `${steps.toLocaleString()} 步`,
      ];
      stats.forEach((text, i) => {
        ctx.fillStyle = ink;
        ctx.font = "bold 27px system-ui";
        ctx.fillText(text, 58 + i * 270, 976);
      });
      ctx.font = "16px system-ui";
      ctx.fillStyle = "#78867a";
      ctx.fillText(
        "步数：手动 / 演示记录 · 示例行程，非完整真实旅行报告",
        58,
        1013,
      );
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.roundRect(58, 1050, 784, 64, 16);
      ctx.fill();
      ctx.fillStyle = bg;
      ctx.font = "bold 23px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(
        award
          ? `${award.icon} ${award.name} · ${award.detail.split(" · ")[0]}`
          : "每一小步，都值得被记住。",
        450,
        1091,
      );
      ctx.textAlign = "left";
    }
    draw().catch(() => notify("照片渲染失败，请尝试 JPG 或 PNG 图片"));
    return () => {
      cancelled = true;
    };
  }, [
    s.photo,
    s.crop,
    s.frame,
    s.title,
    s.startDate,
    s.checkins,
    s.steps,
    award?.id,
  ]);
  async function upload(f: File) {
    setBusy(true);
    try {
      const photo = await preparePhoto(f);
      update((x) => ({ ...x, photo, crop: { x: 50, y: 50, zoom: 1 } }));
      notify("照片已装进回忆里");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function download() {
    canvas.current?.toBlob((blob) => {
      if (!blob) {
        notify("导出失败，请重试");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "漫游搭子-挪威旅行回忆.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("旅行回忆已导出");
    }, "image/png");
  }
  return (
    <div className="report-page">
      <div className="report-intro">
        <div className="section-eyebrow">COLLECT MOMENTS, NOT THINGS</div>
        <h1>
          风景会远去，
          <br />
          回忆会发光<span>✦</span>
        </h1>
        <p>把走过的路，装进一张属于你的旅行明信片。</p>
        <div className="report-stats">
          <div>
            <MapPin size={18} />
            <b>{unique.size}</b>
            <span>打卡景点</span>
          </div>
          <div>
            <Flag size={18} />
            <b>
              {Math.round(
                (s.items.filter((i) => unique.has(i.placeId)).length /
                  Math.max(1, s.items.length)) *
                  100,
              )}
              %
            </b>
            <span>探索完成度</span>
          </div>
          <div>
            <Footprints size={18} />
            <b>{steps.toLocaleString()}</b>
            <span>手动 / 演示步数</span>
          </div>
        </div>
        <div className="report-expense">
          旅行花费 <b>{money(total, "CNY")}</b>
          <small>含示例账目 · {s.rates.date} 参考汇率</small>
        </div>
        <h3>这一路，解锁了这些小惊喜</h3>
        <div className="achievement-grid">
          {achievements(s).map((a) => (
            <div
              key={a.id}
              className={"achievement " + (a.unlocked ? "unlocked" : "")}
              title={a.detail}
            >
              <span>{a.icon}</span>
              <b>{a.name}</b>
              <small>{a.unlocked ? "已解锁" : "待探索"}</small>
            </div>
          ))}
        </div>
        <p className="fineprint">
          报告基于当前浏览器的打卡与账本生成；演示打卡、手动记录及模拟步数均计入此原型报告。照片仅保存在当前浏览器。
        </p>
      </div>
      <div className="postcard-area">
        <div className={"postcard frame-" + s.frame}>
          <canvas ref={canvas} aria-label="旅行照片相框预览" />
        </div>
        <div className="postcard-toolbar">
          <span>给回忆换个边框</span>
          {["#e5d3a2", "#a6c8d6", "#d6aaa1"].map((color, i) => (
            <button
              aria-label={`相框风格${i + 1}`}
              aria-pressed={s.frame === i}
              style={{ background: color }}
              className={s.frame === i ? "chosen" : ""}
              key={i}
              onClick={() => update((x) => ({ ...x, frame: i }))}
            />
          ))}
          <button
            className="shuffle"
            title="随机切换已解锁成就"
            aria-label="随机切换成就"
            onClick={() => {
              if (unlocked.length < 2) {
                notify(
                  unlocked.length
                    ? "再解锁一枚成就，就能切换啦"
                    : "先去打卡，解锁你的第一枚成就",
                );
                return;
              }
              setBadge(
                (b) =>
                  b + 1 + Math.floor(Math.random() * (unlocked.length - 1)),
              );
            }}
          >
            <Shuffle size={17} />
          </button>
        </div>
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        {s.photo && (
          <div className="crop-controls">
            {(
              [
                ["横向位置", "x", 0, 100, 0.5],
                ["纵向位置", "y", 0, 100, 0.5],
                ["照片缩放", "zoom", 1, 3, 0.01],
              ] as const
            ).map(([label, key, min, max, step]) => (
              <label key={key}>
                {label}
                <input
                  aria-label={label}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={s.crop[key]}
                  onChange={(e) =>
                    update((x) => ({
                      ...x,
                      crop: { ...x.crop, [key]: Number(e.target.value) },
                    }))
                  }
                />
              </label>
            ))}
          </div>
        )}
        <div className="report-buttons">
          <button
            className="secondary"
            onClick={() => file.current?.click()}
            disabled={busy}
          >
            {s.photo ? <Upload size={17} /> : <ImagePlus size={17} />}{" "}
            {busy ? "正在装裱…" : s.photo ? "换一张照片" : "放入我的照片"}
          </button>
          <button className="primary" onClick={download}>
            <Download size={17} />
            导出明信片
          </button>
        </div>
      </div>
    </div>
  );
}
