import type { PublicLocale } from "./public-locale";

type AboutCopy = {
  hero: {
    label: string;
    title: string;
    body: string;
    signal: string[];
  };
  why: {
    label: string;
    title: string;
    paragraphs: string[];
  };
  build: {
    label: string;
    title: string;
    body: string;
    steps: Array<{ number: string; title: string; body: string }>;
  };
  /** The company's ambition, read after the people (owner, 2026-09-10). */
  vision: {
    label: string;
    paragraphs: string[];
  };
  team: {
    label: string;
    title: string;
    portraitAlt: string;
    members: Array<{
      number: "01" | "02" | "03";
      name: string;
      romanName?: string;
      role: string;
      affiliation: string;
      bio: string;
    }>;
  };
  cta: {
    label: string;
    title: string;
    body: string;
    primary: string;
    secondary: string;
  };
};

export const ABOUT_COPY: Record<PublicLocale, AboutCopy> = {
  en: {
    hero: {
      label: "About Leona",
      title: "Quantum software for research and learning.",
      body: "Leona Quantum brings quantum code generation, execution, and verification into one workspace.",
      signal: ["DESIGN", "EXECUTE", "VERIFY", "REUSE"],
    },
    why: {
      label: "Why we build",
      title: "Quantum work is still divided across too many layers.",
      paragraphs: [
        "Quantum development involves hardware, cloud services, SDKs, algorithm design, implementation, and verification.",
        "Researchers in chemistry, finance, and optimization need to connect the problems they know to quantum methods they can evaluate.",
        "Leona brings these steps together so researchers can develop a circuit, inspect the result, and continue their work.",
      ],
    },
    build: {
      label: "03 / WHAT WE BUILD",
      title: "From a question to a quantum circuit you can inspect.",
      body: "Leona keeps the development loop together. The AI plans and builds, the simulator returns evidence, and the result becomes reusable knowledge instead of disappearing into a one-off experiment.",
      steps: [
        { number: "01", title: "Describe", body: "Express the problem and constraints in natural language." },
        { number: "02", title: "Design & run", body: "Turn the plan into quantum code and execute it in a supported environment." },
        { number: "03", title: "Verify", body: "Review the result, its checks, and the conditions that produced it." },
        { number: "04", title: "Keep & reuse", body: "Preserve the circuit and evidence so the work can be revisited and extended." },
      ],
    },
    vision: {
      label: "Where we are going",
      paragraphs: [
        "Leona Quantum started with three researchers who kept running into the same wall. Quantum computing is full of ideas that are hard to get from a paper onto a machine, and harder still to check once they are there. We are building the workspace that closes that gap: a question becomes a circuit, the circuit runs, and the result comes back with its evidence attached.",
        "Our ambition is a platform that gets better with every run it makes. Each verified circuit, each paper tied to its method in the Atlas and each lesson someone completes teaches the system a little more about how quantum work is actually done. A chemist, a student and a hardware team should reach the same tools and trust the same answers, and the record of how those answers were produced should stay open.",
      ],
    },
    team: {
      label: "Our team",
      title: "Meet the founders",
      portraitAlt: "Portrait of {name}",
      members: [
        {
          number: "01",
          name: "鈴木類",
          role: "CEO",
          affiliation: "Keio University · Information and Computer Science",
          bio: "Rui has researched multiple zeta functions and worked on robotics competitions, AI companion robots, and Vision-Language-Action research, with a focus on carrying theory into systems that work in the physical world.",
        },
        {
          number: "02",
          name: "Lê Quang Tuấn (渡邉黎)",
          role: "COO",
          affiliation: "Keio University · Applied Physics and Physico-Informatics",
          bio: "Rei researches spintronics and topological insulators, and has also worked in machine-learning education and learning support for displaced communities.",
        },
        {
          number: "03",
          name: "Eshaan Mistry",
          role: "CTO",
          affiliation: "UC Berkeley · Physics, Computer Science, and Chemistry",
          bio: "Eshaan has applied AI to physical simulation, life science, and quantum machine learning through work at Lawrence Berkeley National Laboratory, NASA Ames Research Center, and research teams at Berkeley and Keio.",
        },
      ],
    },
    cta: {
      label: "Work with us",
      title: "Tell us about your research.",
      body: "Contact us about a research project, product access, or collaboration.",
      primary: "Talk to us",
      secondary: "Open the workspace",
    },
  },
  ja: {
    hero: {
      label: "Leonaについて",
      title: "研究と学びのための量子ソフトウェア。",
      body: "Leona Quantumは、量子コードの生成、実行、検証をひとつのワークスペースにまとめます。",
      signal: ["設計", "実行", "検証", "再利用"],
    },
    why: {
      label: "開発の背景",
      title: "量子開発には、複数の専門領域が関わります。",
      paragraphs: [
        "量子コンピューティングには大きな可能性があります。一方で、実際の開発には、量子ハードウェアやクラウド、SDK、アルゴリズム、実装、検証と、いくつもの専門領域をまたぐ必要があります。",
        "この複雑さが、化学や金融、最適化などの知見を持つ人と量子技術の間に、まだ高い壁をつくっています。",
        "私たちは、問いを実行できる形へ変え、確かめ、もう一度使える知識として残すまでを、ひとつの環境でつなごうとしています。",
      ],
    },
    build: {
      label: "03 / WHAT WE BUILD",
      title: "問いから、\n検証できる量子回路へ。",
      body: "Leonaは、量子開発のループを分断しません。AIによる設計と実装、シミュレーション、結果の検証、リポジトリへの保存までをつなぎ、一度きりの実験を再利用できる知識へ変えていきます。",
      steps: [
        { number: "01", title: "問いを伝える", body: "解きたい課題と条件を、自然言語で入力します。" },
        { number: "02", title: "設計し、実行する", body: "AIが計画を量子コードへ落とし込み、対応する環境で実行します。" },
        { number: "03", title: "結果を確かめる", body: "結果だけでなく、検証内容と実行条件まで確認できます。" },
        { number: "04", title: "知識として残す", body: "回路と根拠を保存し、後から参照、再利用できる形にします。" },
      ],
    },
    vision: {
      label: "目指す場所",
      paragraphs: [
        "Leona Quantumは、同じ壁に何度もぶつかってきた3人の研究者から始まりました。量子コンピューティングには、論文から実機へ運ぶのが難しいアイデアがあふれていて、運んだあとに確かめるのはさらに難しい。その隔たりを埋めるワークスペースを作っています。問いが回路になり、回路が動き、結果が検証記録とともに返ってくる場所です。",
        "私たちが目指すのは、実行のたびに良くなっていくプラットフォームです。検証済みの回路、Atlasで手法と結びついた論文、誰かが修了した教材のひとつひとつが、量子の仕事が実際にどう進むのかをシステムに教えていきます。化学者も、学生も、ハードウェアのチームも、同じ道具にたどり着いて同じ答えを信頼できるように。そして、その答えがどう作られたかの記録は、開かれたままにしておきます。",
      ],
    },
    team: {
      label: "チーム",
      title: "創業者を紹介します",
      portraitAlt: "{name}のポートレート",
      members: [
        {
          number: "01",
          name: "鈴木類",
          role: "CEO",
          affiliation: "慶應義塾大学 理工学部 情報工学科",
          bio: "多重ゼータ関数の研究に取り組み、ロボット競技やAI対話ロボット、Vision-Language-Actionモデルの研究開発を通じて、理論を実際に動くシステムへ落とし込んできました。",
        },
        {
          number: "02",
          name: "Lê Quang Tuấn (渡邉黎)",
          role: "COO",
          affiliation: "慶應義塾大学 理工学部 物理情報工学科",
          bio: "スピントロニクスとトポロジカル絶縁体を研究しながら、機械学習教育や難民の学習支援にも携わっています。",
        },
        {
          number: "03",
          name: "Eshaan Mistry",
          role: "CTO",
          affiliation: "カリフォルニア大学バークレー校 物理学・情報科学・化学",
          bio: "ローレンス・バークレー国立研究所やNASA Ames Research Centerなどで、物理シミュレーション、生命科学、量子機械学習へのAI応用に取り組んできました。",
        },
      ],
    },
    cta: {
      label: "お問い合わせ",
      title: "取り組んでいる研究を教えてください。",
      body: "研究、プロダクト利用、共同で探求したい課題について、Leona Quantumにご相談ください。",
      primary: "相談する",
      secondary: "ワークスペースを開く",
    },
  },
};
