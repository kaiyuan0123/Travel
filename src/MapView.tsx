import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapType } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Navigation, Plus, Minus, Globe2, MapPin } from "lucide-react";
import {
  places,
  byId,
  CITIES,
  COLORS,
  ANIMALS,
  transport,
  type City,
  type Item,
  type Checkin,
  type Member,
} from "./data";
import { landmarkSvg } from "./illustrations";
import { dayItems } from "./engine";
import { routeFor, mapAdapter } from "./adapters";
interface Props {
  city: City;
  selected: string | null;
  select: (id: string) => void;
  items: Item[];
  day: number;
  checkins: Checkin[];
  members: Member[];
  travel: boolean;
  transit: boolean;
  focus: [number, number] | null;
  position: [number, number] | null;
}
export function MapView(p: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapType | null>(null),
    markers = useRef<maplibregl.Marker[]>([]),
    latest = useRef(p);
  latest.current = p;
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [overview, setOverview] = useState(false);
  useEffect(() => {
    let alive = true;
    try {
      const instance = new maplibregl.Map({
        container: container.current!,
        style: mapAdapter.style,
        center: CITIES[p.city].center,
        zoom: 12.0,
        pitch: 0,
        attributionControl: { compact: true },
        maxZoom: 18,
      });
      map.current = instance;
      const timer = setTimeout(() => {
        if (alive && !instance.isStyleLoaded()) setFailed(true);
      }, 16000);
      instance.on("style.load", () => {
        if (!alive) return;
        clearTimeout(timer);
        setReady(true);
        setFailed(false);
        for (const layer of instance.getStyle().layers ?? []) {
          try {
            if (layer.type === "fill") {
              if (/water/.test(layer.id))
                instance.setPaintProperty(layer.id, "fill-color", "#b9dce1");
              else if (/park|wood|grass|forest|landcover/.test(layer.id))
                instance.setPaintProperty(layer.id, "fill-color", "#dce7cc");
              else if (/building/.test(layer.id))
                instance.setPaintProperty(layer.id, "fill-color", "#e4e6d7");
            }
            if (layer.type === "background")
              instance.setPaintProperty(
                layer.id,
                "background-color",
                "#f3f1e7",
              );
          } catch {
            /* preserve unsupported layer expressions */
          }
        }
        instance.addSource("routes", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        instance.addLayer({
          id: "route-shadow",
          type: "line",
          source: "routes",
          paint: {
            "line-color": "#ffffff",
            "line-width": ["case", ["get", "active"], 9, 4],
            "line-opacity": 0.9,
          },
          layout: { "line-join": "round", "line-cap": "round" },
        });
        instance.addLayer({
          id: "daily-routes",
          type: "line",
          source: "routes",
          paint: {
            "line-color": ["get", "color"],
            "line-width": ["case", ["get", "active"], 5, 2],
            "line-opacity": ["case", ["get", "active"], 1, 0.35],
            "line-dasharray": [1.5, 1.5],
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
      });
      instance.on("error", () => {
        if (!instance.isStyleLoaded() && alive) setFailed(true);
      });
      return () => {
        alive = false;
        clearTimeout(timer);
        instance.remove();
        map.current = null;
      };
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    if (!map.current) return;
    setOverview(false);
    map.current.flyTo({
      center: CITIES[p.city].center,
      zoom: 12.0,
      duration: 900,
      essential: false,
    });
  }, [p.city]);
  useEffect(() => {
    if (!map.current || !p.selected) return;
    map.current.flyTo({
      center: byId[p.selected].coordinates,
      zoom: Math.max(map.current.getZoom(), 13.3),
      duration: 700,
    });
  }, [p.selected]);
  useEffect(() => {
    if (p.focus)
      map.current?.flyTo({ center: p.focus, zoom: 13, duration: 900 });
  }, [p.focus]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((x) => x.remove());
    markers.current = [];
    const add = (el: HTMLElement, coords: [number, number]) => {
      markers.current.push(
        new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat(coords)
          .addTo(m),
      );
    };
    places
      .filter((place) => place.city === p.city)
      .forEach((place) => {
        const done = p.checkins.some((c) => c.placeId === place.id),
          item = dayItems(p.items, p.day).findIndex(
            (i) => i.placeId === place.id,
          );
        const el = document.createElement("button");
        el.className = `map-pin ${place.id === p.selected ? "selected" : ""} ${done ? "done" : ""}`;
        el.setAttribute("aria-label", place.name);
        el.innerHTML = `<span class="pin-art">${landmarkSvg(place.icon, place.color)}</span><span class="pin-caption">${done ? "✓ " : ""}${place.name}${item >= 0 ? `<b>${item + 1}</b>` : ""}</span>`;
        el.onclick = () => latest.current.select(place.id);
        add(el, place.coordinates);
      });
    if (p.transit)
      transport
        .filter((t) => t.city === p.city)
        .forEach((t) => {
          const el = document.createElement("div");
          el.className = "transit-pin";
          el.textContent = (t.type === "airport" ? "✈ " : "▣ ") + t.name;
          add(el, t.coordinates);
        });
    if (p.travel)
      p.members.slice(1).forEach((member, i) => {
        const el = document.createElement("div");
        el.className = "friend-pin";
        el.innerHTML = `<span>${ANIMALS[member.animal]}</span><small>${member.name.replace(/[<>&]/g, "")} · 模拟</small>`;
        const c = CITIES[p.city].center;
        add(el, [c[0] + 0.009 + i * 0.012, c[1] - 0.002 - i * 0.005]);
      });
    if (p.position) {
      const el = document.createElement("div");
      el.className = "my-location";
      el.title = "你的位置";
      add(el, p.position);
    }
    return () => {
      markers.current.forEach((x) => x.remove());
      markers.current = [];
    };
  }, [
    p.city,
    p.selected,
    p.checkins,
    p.items,
    p.day,
    p.travel,
    p.members,
    p.transit,
    p.position,
  ]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const features = [0, 1, 2, 3, 4]
      .map((day) => ({
        type: "Feature" as const,
        properties: { color: COLORS[day], active: p.day === day },
        geometry: {
          type: "LineString" as const,
          coordinates: routeFor(
            dayItems(p.items, day).filter(
              (i) => byId[i.placeId].city === p.city,
            ),
          ).coordinates,
        },
      }))
      .filter((f) => f.geometry.coordinates.length > 1);
    (map.current.getSource("routes") as maplibregl.GeoJSONSource)?.setData({
      type: "FeatureCollection",
      features,
    });
  }, [ready, p.items, p.day, p.city]);
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const m = map.current;
      if (!m) return;
      m.resize();
      m.setPadding({
        top: 0,
        bottom: latest.current.travel ? 30 : 260,
        left: 30,
        right: 30,
      });
    });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="map-wrap">
      <div ref={container} className="map-canvas" />
      {failed && (
        <div className="map-fallback">
          <MapPin size={30} />
          <b>地图暂时没有加载出来</b>
          <p>你的行程已保留，仍可在右侧浏览与添加景点。</p>
          <button
            onClick={() => {
              setFailed(false);
              map.current?.setStyle(
                "https://tiles.openfreemap.org/styles/liberty",
              );
            }}
          >
            重新加载地图
          </button>
        </div>
      )}
      {!ready && !failed && (
        <div className="map-loading">
          <span className="spinner" />
          正在展开你的北欧地图…
        </div>
      )}
      <div className="map-controls">
        <button aria-label="放大地图" onClick={() => map.current?.zoomIn()}>
          <Plus size={20} />
        </button>
        <button aria-label="缩小地图" onClick={() => map.current?.zoomOut()}>
          <Minus size={20} />
        </button>
        <i />
        <button
          aria-label="回到当前城市"
          onClick={() => {
            setOverview(false);
            map.current?.flyTo({ center: CITIES[p.city].center, zoom: 12.0 });
          }}
        >
          <Navigation size={18} />
        </button>
        <button
          title="挪威全景"
          aria-label="挪威全景"
          className={overview ? "active" : ""}
          onClick={() => {
            setOverview(true);
            map.current?.flyTo({ center: [8.0, 61.3], zoom: 5.7 });
          }}
        >
          <Globe2 size={19} />
        </button>
      </div>
      <div className="map-scale-note">
        <span className="live-dot" />
        真实地理 · 路线为示意估算
      </div>
    </div>
  );
}
