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
    description:
      "基礎講義とハンズオンで学び、チームで最初の実験に取り組みます。",
    schedule: [
      {
        period: "午前",
        title: "Quantum／Qiskit 101 — 基礎講義",
        description:
          "受付・環境確認のあと、量子ビット・ゲート・測定の基礎を学び、Qiskitで最初の量子回路を動かします。",
      },
      {
        period: "午前・午後",
        title: "講演・質疑",
        description:
          "研究や産業応用の現場に触れる講演。登壇者への質疑の時間も設けます。",
      },
      {
        period: "午後",
        title: "SQD入門・ハンズオン",
        description:
          "導入講義のあと、原則2人1組でNotebookを使った実習に取り組みます。",
      },
      {
        period: "午後",
        title: "チャレンジ説明・チーム形成",
        description:
          "課題、提出形式、審査基準を確認。4〜5名のチームを組み、役割を分担します。",
      },
      {
        period: "夕方",
        title: "ミニハッカソン — 制作スタート",
        description:
          "課題を選び、まずは基本のコードを実行。実験計画を立て、進捗や疑問点を翌日へ引き継ぎます。",
      },
    ],
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
    description:
      "講演で視野を広げながら制作を進め、試したことと得られた結果を発表します。",
    schedule: [
      {
        period: "午前",
        title: "講演・質疑",
        description:
          "量子計算の研究や応用をテーマにした講演を通して、学びを深めます。",
      },
      {
        period: "午前・午後",
        title: "ミニハッカソン — 実験・実装",
        description:
          "メンターの支援を受けながらチーム制作。条件を変えて結果を比較し、グラフなどで可視化します。",
      },
      {
        period: "午後",
        title: "Notebook提出・発表準備",
        description:
          "実行結果と考察をNotebookにまとめて提出。3枚以内の発表資料を準備します。",
      },
      {
        period: "夕方",
        title: "成果発表",
        description:
          "各チームが3分間で取り組みを発表し、2分間の質疑で学びを共有します。",
      },
      {
        period: "夕方",
        title: "講評・表彰・閉会",
        description:
          "成果への講評と表彰を行い、2日間を振り返ります。閉会後は交流の時間を予定しています。",
      },
    ],
    speakers: [
      {
        name: "田中 宗",
        affiliation: "教授",
        title: "量子アニーリングについて",
        note: "登壇予定 / 内容調整中",
      },
      {
        name: "小山 尚彦",
        affiliation: "先生",
        title: "量子機械学習について",
        note: "登壇予定 / 内容調整中",
      },
    ],
  },
] as const;
