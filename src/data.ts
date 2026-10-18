export type City = "oslo" | "bergen";
export type Currency = "NOK" | "EUR" | "CNY";
export type Source = "demo" | "manual" | "gps";
export interface Place {
  id: string;
  city: City;
  name: string;
  local: string;
  category: string;
  icon: string;
  coordinates: [number, number];
  description: string;
  duration: number;
  rating: number;
  color: string;
  source: string;
}
export interface Item {
  id: string;
  placeId: string;
  day: number;
  start: number;
  end: number;
}
export interface Member {
  id: string;
  name: string;
  animal: number;
}
export interface Expense {
  id: string;
  title: string;
  day: number;
  category: string;
  amount: number;
  currency: Currency;
  payer: string;
  participants: string[];
}
export interface Checkin {
  id: string;
  placeId: string;
  day: number;
  source: Source;
  at: string;
}
export interface Rates {
  date: string;
  source: "demo" | "manual" | "Frankfurter";
  perEUR: Record<Currency, number>;
}
export interface Snapshot {
  at: string;
  currency: Currency;
  rates: Rates;
  expenses: Expense[];
  members: Member[];
}
export interface State {
  version: 1;
  title: string;
  startDate: string;
  items: Item[];
  members: Member[];
  expenses: Expense[];
  checkins: Checkin[];
  steps: Record<number, { value: number; source: "manual" | "demo" }>;
  rates: Rates;
  settlement: Snapshot | null;
  photo: string | null;
  crop: { x: number; y: number; zoom: number };
  frame: number;
}
export const COLORS = ["#f2a943", "#6b9bdb", "#ac8bd1", "#e5848b", "#46a898"];
export const DAYS = [
  "初见奥斯陆",
  "艺术与慢时光",
  "向峡湾出发",
  "卑尔根漫游",
  "山海的回响",
];
export const ANIMALS = ["🦊", "🐻", "🐰", "🐱", "🐼", "🐨"];
export const CITIES = {
  oslo: {
    name: "奥斯陆",
    local: "Oslo",
    center: [10.738, 59.913] as [number, number],
  },
  bergen: {
    name: "卑尔根",
    local: "Bergen",
    center: [5.326, 60.393] as [number, number],
  },
};
const osloSource = "https://www.visitoslo.com/activities-and-attractions";
const bergenSource = "https://en.visitbergen.com/things-to-do/attractions";
const raw: [
  string,
  City,
  string,
  string,
  string,
  string,
  number,
  number,
  string,
  number,
  number,
  string,
][] = [
  [
    "opera",
    "oslo",
    "奥斯陆歌剧院",
    "Oslo Opera House",
    "建筑",
    "opera",
    10.753,
    59.9075,
    "走上白色大理石屋顶，把城市与峡湾一起收入眼底。建筑本身就是一场免费的风景。",
    90,
    4.9,
    "#c6e3e7",
  ],
  [
    "munch",
    "oslo",
    "蒙克博物馆",
    "MUNCH",
    "艺术",
    "art",
    10.7552,
    59.9061,
    "在海湾边走近蒙克的艺术世界，顶层还能收获一份城市全景。",
    120,
    4.8,
    "#eed7b5",
  ],
  [
    "vigeland",
    "oslo",
    "维格兰雕塑公园",
    "Vigeland Park",
    "自然",
    "tree",
    10.7005,
    59.927,
    "沿林荫步道寻找生动的人物雕塑，给旅途留一段不赶时间的散步。",
    120,
    4.9,
    "#d0dfbb",
  ],
  [
    "akershus",
    "oslo",
    "阿克什胡斯城堡",
    "Akershus Fortress",
    "历史",
    "castle",
    10.7369,
    59.9075,
    "在石墙、草坡和古老城门之间散步，俯瞰奥斯陆港的帆船。",
    90,
    4.7,
    "#e3d8bc",
  ],
  [
    "palace",
    "oslo",
    "挪威王宫",
    "The Royal Palace",
    "历史",
    "castle",
    10.7276,
    59.9169,
    "穿过王宫公园，在开阔的广场感受北欧日常的松弛与庄重。",
    60,
    4.6,
    "#edcdbf",
  ],
  [
    "national",
    "oslo",
    "挪威国家博物馆",
    "National Museum",
    "艺术",
    "art",
    10.7303,
    59.911,
    "从绘画到设计，在挪威最大的艺术博物馆慢慢发现灵感。",
    150,
    4.9,
    "#d1d9e4",
  ],
  [
    "aker",
    "oslo",
    "阿克尔码头",
    "Aker Brygge",
    "城市",
    "harbor",
    10.725,
    59.909,
    "沿海边木栈道散步，找一家咖啡馆，看船只来往与夕阳。",
    90,
    4.7,
    "#bcdadd",
  ],
  [
    "fram",
    "oslo",
    "前进号博物馆",
    "Fram Museum",
    "历史",
    "ship",
    10.698,
    59.8962,
    "登上极地探险船，感受远征故事与挪威人对未知世界的好奇。",
    120,
    4.8,
    "#c5d8d3",
  ],
  [
    "library",
    "oslo",
    "比约维卡图书馆",
    "Deichman Bjørvika",
    "建筑",
    "book",
    10.7521,
    59.908,
    "在开放而明亮的图书馆歇脚，沿层叠楼梯发现城市的阅读客厅。",
    60,
    4.7,
    "#dfd7bd",
  ],
  [
    "ekeberg",
    "oslo",
    "埃克贝格公园",
    "Ekebergparken",
    "自然",
    "tree",
    10.773,
    59.8988,
    "森林步道与当代雕塑相遇，从高处回望海湾与歌剧院。",
    120,
    4.7,
    "#ccdcb5",
  ],
  [
    "grun",
    "oslo",
    "格吕纳洛卡",
    "Grünerløkka",
    "城市",
    "cafe",
    10.7594,
    59.9236,
    "独立小店、街头艺术和河边咖啡，在街区里找到自己的节奏。",
    120,
    4.6,
    "#ead5bc",
  ],
  [
    "holmen",
    "oslo",
    "霍尔门科伦",
    "Holmenkollen",
    "自然",
    "mountain",
    10.6678,
    59.9635,
    "抬头看标志性跳台，远处的森林与峡湾连接成一片北欧风景。",
    120,
    4.7,
    "#c6dce2",
  ],
  [
    "bryggen",
    "bergen",
    "布吕根码头",
    "Bryggen",
    "历史",
    "houses",
    5.3245,
    60.397,
    "彩色木屋倒映在港湾，钻进窄巷，听见汉萨时代留下的故事。",
    90,
    4.9,
    "#e6b8a1",
  ],
  [
    "floyen",
    "bergen",
    "弗洛伊恩山",
    "Mount Fløyen",
    "自然",
    "mountain",
    5.3431,
    60.3991,
    "乘缆车登高，彩色屋顶与峡湾铺展在脚下，再沿森林步道慢行。",
    150,
    4.9,
    "#c8dcb8",
  ],
  [
    "fish",
    "bergen",
    "卑尔根鱼市",
    "Fish Market",
    "美食",
    "fish",
    5.3246,
    60.3954,
    "在港口边逛逛摊位，认识当地海味，给旅行加一份鲜活滋味。",
    60,
    4.5,
    "#c2dfe4",
  ],
  [
    "ulriken",
    "bergen",
    "乌尔里肯山",
    "Mount Ulriken",
    "自然",
    "mountain",
    5.3866,
    60.3775,
    "登上卑尔根七山中的最高峰，在开阔山顶看城市延伸到海。",
    180,
    4.8,
    "#c6d9ba",
  ],
  [
    "kode",
    "bergen",
    "KODE 艺术博物馆",
    "KODE",
    "艺术",
    "art",
    5.3287,
    60.3898,
    "沿湖分布的艺术空间，收藏北欧绘画、设计与城市的审美日常。",
    120,
    4.7,
    "#ded0b8",
  ],
  [
    "hus",
    "bergen",
    "卑尔根城堡",
    "Bergenhus Fortress",
    "历史",
    "castle",
    5.3173,
    60.401,
    "走过港边的古老堡垒，在霍肯大厅外感受城市漫长的历史。",
    90,
    4.7,
    "#d8d9bc",
  ],
  [
    "nordnes",
    "bergen",
    "努尔内斯公园",
    "Nordnes Park",
    "自然",
    "tree",
    5.3028,
    60.3998,
    "沿半岛走向海边，找一张长椅，给旅途安排一段发呆时间。",
    90,
    4.6,
    "#c9ddba",
  ],
  [
    "aquarium",
    "bergen",
    "卑尔根水族馆",
    "Bergen Aquarium",
    "自然",
    "fish",
    5.3033,
    60.3994,
    "在半岛尽头认识海洋生物，是一段适合放慢脚步的海边时光。",
    120,
    4.6,
    "#bcdce3",
  ],
  [
    "oldbergen",
    "bergen",
    "老卑尔根博物馆",
    "Old Bergen Museum",
    "历史",
    "houses",
    5.3097,
    60.4186,
    "穿过传统木屋与旧街巷，想象从前的卑尔根如何度过一天。",
    120,
    4.7,
    "#e8cab5",
  ],
  [
    "lake",
    "bergen",
    "小伦格湖",
    "Lille Lungegårdsvannet",
    "城市",
    "harbor",
    5.3293,
    60.3902,
    "在城市中央的小湖边绕一圈，喷泉、花园和山景都在身边。",
    45,
    4.6,
    "#bfdde0",
  ],
  [
    "church",
    "bergen",
    "圣玛丽教堂",
    "St. Mary’s Church",
    "历史",
    "castle",
    5.3232,
    60.3996,
    "在布吕根背后拜访古老石教堂，发现港口之外安静的历史角落。",
    45,
    4.6,
    "#d8d1be",
  ],
  [
    "skostredet",
    "bergen",
    "斯科斯特雷街",
    "Skostredet",
    "美食",
    "cafe",
    5.3281,
    60.3945,
    "小餐馆与独立店铺藏在彩色街道里，适合没有目的地地逛逛。",
    90,
    4.7,
    "#e7c9b5",
  ],
];
export const places: Place[] = raw.map(
  ([
    id,
    city,
    name,
    local,
    category,
    icon,
    lng,
    lat,
    description,
    duration,
    rating,
    color,
  ]) => ({
    id,
    city,
    name,
    local,
    category,
    icon,
    coordinates: [lng, lat],
    description,
    duration,
    rating,
    color,
    source: city === "oslo" ? osloSource : bergenSource,
  }),
);
export const byId = Object.fromEntries(places.map((p) => [p.id, p])) as Record<
  string,
  Place
>;
export const seedRates: Rates = {
  date: "2026-10-16",
  source: "demo",
  perEUR: { EUR: 1, NOK: 11.7, CNY: 7.8 },
};
export const freshState = (): State => ({
  version: 1,
  title: "挪威，慢慢走",
  startDate: "2027-06-10",
  members: [
    { id: "me", name: "小漫", animal: 0 },
    { id: "m2", name: "阿熊", animal: 1 },
    { id: "m3", name: "兔几", animal: 2 },
  ],
  items: [
    ["opera", 0, 540, 630],
    ["library", 0, 650, 710],
    ["munch", 0, 780, 900],
    ["akershus", 0, 930, 1020],
    ["vigeland", 1, 570, 690],
    ["national", 1, 810, 960],
    ["bryggen", 3, 570, 660],
    ["fish", 3, 690, 750],
    ["floyen", 3, 840, 990],
    ["kode", 4, 600, 720],
    ["lake", 4, 750, 795],
  ].map(([placeId, day, start, end], i) => ({
    id: "seed" + i,
    placeId: String(placeId),
    day: Number(day),
    start: Number(start),
    end: Number(end),
  })),
  expenses: [
    {
      id: "e1",
      title: "海边的第一顿午餐",
      day: 0,
      category: "餐饮",
      amount: 72000,
      currency: "NOK",
      payer: "me",
      participants: ["me", "m2", "m3"],
    },
    {
      id: "e2",
      title: "奥斯陆住宿 · 两晚",
      day: 0,
      category: "住宿",
      amount: 360000,
      currency: "NOK",
      payer: "m2",
      participants: ["me", "m2", "m3"],
    },
    {
      id: "e3",
      title: "博物馆门票",
      day: 1,
      category: "景点",
      amount: 54000,
      currency: "NOK",
      payer: "m3",
      participants: ["me", "m2", "m3"],
    },
  ],
  checkins: [],
  steps: {},
  rates: structuredClone(seedRates),
  settlement: null,
  photo: null,
  crop: { x: 50, y: 50, zoom: 1 },
  frame: 0,
});
export const transport = [
  {
    city: "oslo",
    name: "Oslo S 中央车站",
    coordinates: [10.7528, 59.9108] as [number, number],
    type: "train",
  },
  {
    city: "oslo",
    name: "Oslo Gardermoen 机场",
    coordinates: [11.1004, 60.1939] as [number, number],
    type: "airport",
  },
  {
    city: "bergen",
    name: "Bergen 车站",
    coordinates: [5.3332, 60.3895] as [number, number],
    type: "train",
  },
  {
    city: "bergen",
    name: "Bergen Flesland 机场",
    coordinates: [5.2181, 60.2934] as [number, number],
    type: "airport",
  },
];
