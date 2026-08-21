import type { Greentea, Temple, Genre, Area, Comment } from "@/types";

// 受け取る userId は二重プレフィックス構造になっている点に注意:
//   1. auth.ts authorize:   user.id = "mock-<name>"
//   2. auth.ts jwt callback: token.railsJwt = "mock:" + user.id  →  "mock:mock-<name>"
//   3. extractMockUserId:    "mock:" を剥がして "mock-<name>" を userId として返す
// したがってここに渡る userId は通常 "mock-<name>" であり、先頭の "mock-" を
// 剥がすと表示名 <name> が得られる。形式が違うトークンが渡るケースの保険として
// プレフィックスが無いときはそのまま返す。
export function mockUserName(userId: string): string {
  return userId.startsWith("mock-") ? userId.slice("mock-".length) : userId;
}

export const mockGenres: Genre[] = [
  { id: 1, name: "パフェ" },
  { id: 2, name: "ドリンク" },
  { id: 3, name: "団子" },
];

export const mockAreas: Area[] = [
  { id: 1, name: "東山区" },
  { id: 2, name: "中京区" },
  { id: 3, name: "右京区" },
];

// 既存スポットに紐づくサンプル口コミ（モック初期表示用）。
// ユーザー ID は数値で持っているが、モックユーザーは文字列 ID なので
// 削除権限の判定には引っかからない（= seed 口コミは消せない）。
const seedComment: Comment = {
  id: 1,
  body: "抹茶パフェが最高でした！",
  user: { id: 1, name: "抹茶好き" },
  created_at: "2024-01-15T10:30:00Z",
};

export const mockGreenteas: Greentea[] = [
  {
    id: 1,
    name: "茶寮都路里",
    description: "宇治抹茶を使ったパフェが人気の老舗甘味処。",
    address: "京都市東山区祇園町南側",
    access: "祇園四条駅から徒歩5分",
    phone_number: "075-000-0001",
    business_hours: "10:00-21:00",
    holiday: "不定休",
    homepage: "https://example.com/tsujiri",
    closed: false,
    img: "",
    latitude: 35.0036,
    longitude: 135.7714,
    genres: [mockGenres[0]],
    likes_count: 12,
  },
  {
    id: 2,
    name: "中村藤吉本店",
    description: "石臼挽き抹茶のスイーツとお茶を楽しめる名店。",
    address: "京都市中京区河原町通",
    access: "京都市役所前駅から徒歩3分",
    phone_number: "075-000-0002",
    business_hours: "10:00-18:00",
    holiday: "水曜日",
    homepage: "https://example.com/nakamura",
    closed: false,
    img: "",
    latitude: 35.0094,
    longitude: 135.7689,
    genres: [mockGenres[0], mockGenres[1]],
    likes_count: 8,
  },
  {
    id: 3,
    name: "ぎおん徳屋",
    description: "出来たての本わらび餅と抹茶が味わえる。",
    address: "京都市東山区祇園町南側",
    access: "祇園四条駅から徒歩7分",
    phone_number: "075-000-0003",
    business_hours: "12:00-18:00",
    holiday: "不定休",
    homepage: "https://example.com/tokuya",
    closed: false,
    img: "",
    latitude: 35.0028,
    longitude: 135.7752,
    genres: [mockGenres[2]],
    likes_count: 20,
  },
];

export const mockTemples: Temple[] = [
  {
    id: 1,
    name: "建仁寺",
    description: "京都最古の禅寺。風神雷神図屏風で知られる。",
    address: "京都市東山区大和大路通四条下る",
    access: "祇園四条駅から徒歩7分",
    phone_number: "075-000-1001",
    business_hours: "10:00-17:00",
    holiday: "なし",
    homepage: "https://example.com/kenninji",
    img: "",
    latitude: 35.0,
    longitude: 135.7741,
    areas: [mockAreas[0]],
    likes_count: 15,
  },
  {
    id: 2,
    name: "八坂神社",
    description: "祇園さんの愛称で親しまれる京都の総鎮守。",
    address: "京都市東山区祇園町北側",
    access: "祇園四条駅から徒歩5分",
    phone_number: "075-000-1002",
    business_hours: "終日参拝可",
    holiday: "なし",
    homepage: "https://example.com/yasaka",
    img: "",
    latitude: 35.0036,
    longitude: 135.7785,
    areas: [mockAreas[0]],
    likes_count: 30,
  },
  {
    id: 3,
    name: "二条城",
    description: "徳川家ゆかりの世界遺産。二の丸御殿が有名。",
    address: "京都市中京区二条通堀川西入二条城町",
    access: "二条城前駅すぐ",
    phone_number: "075-000-1003",
    business_hours: "08:45-16:00",
    holiday: "12月29日〜31日",
    homepage: "https://example.com/nijojo",
    img: "",
    latitude: 35.0142,
    longitude: 135.7481,
    areas: [mockAreas[1]],
    likes_count: 25,
  },
];

export const seedGreenteaComments: Record<number, Comment[]> = {
  1: [seedComment],
};
export const seedTempleComments: Record<number, Comment[]> = {
  1: [{ ...seedComment, id: 2, body: "建仁寺の風神雷神図、圧巻でした。" }],
};
