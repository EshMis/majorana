/** Owner-supplied event facts. Unconfirmed operational details stay explicit. */
export const event = {
  title: "Qiskit Fall Fest 2026 @ Keio",
  path: "/events/qiskit-fall-fest-2026",
  registrationUrl: "https://forms.gle/Fir3TT1umiuWGnGu9" as string | null,
  contactEmail: "admin@leonaquantum.com",
  venueDetails: null as string | null,
  venueMapUrl: null as string | null,
  organizers: ["慶應義塾大学", "IBM Quantum"],
  supporters: ["Leona Quantum", "Quanmatic", "Blueqat"],
  // Enabled at the owner's explicit request; this flag does not assert test completion.
  registrationEnabled: true,
};

export const days = [
  {
    id: "saturday",
    date: "10.17",
    weekday: "土",
    english: "Saturday",
    description: "研究と実践の現場から、量子計算を考える。",
    speakers: [
      {
        name: "齋藤 善仁",
        affiliation: "Quanmatic",
        title: "量子ビット数制約下における部分グローバー適応探索手法",
        note: "登壇予定 / 仮題",
      },
      {
        name: "湊 雄一郎",
        affiliation: "Blueqat",
        title: "講演内容調整中",
        note: "登壇予定",
      },
    ],
  },
  {
    id: "sunday",
    date: "10.18",
    weekday: "日",
    english: "Sunday",
    description: "田中宗教授・小山尚彦先生の講演を予定。",
    speakers: [
      {
        name: "田中 宗",
        affiliation: "教授",
        title: "講演内容調整中",
        note: "登壇予定",
      },
      {
        name: "小山 尚彦",
        affiliation: "先生",
        title: "講演内容調整中",
        note: "登壇予定",
      },
    ],
  },
] as const;
