import type { Metadata } from "next";
import Image from "next/image";
import { LeonaWordmark } from "../../../components/leona-wordmark";
import { canonicalMetadata } from "../../../lib/public-metadata";
import { event } from "./event";
import { Program } from "./program";
import s from "./page.module.css";

export const revalidate = 300;
export const metadata: Metadata = {
  title: event.title,
  description:
    "2026年10月17日・18日、慶應義塾大学AICで開催。講演、Qiskitハンズオン、チームで取り組むミニハッカソン。初心者歓迎。",
  ...canonicalMetadata("/events/qiskit-fall-fest-2026"),
  robots: { index: true, follow: true },
};

const experiences = [
  [
    "回路をつくる",
    "Qiskitで量子ビットとゲートを組み合わせ、自分の量子回路を作成します。",
  ],
  [
    "動かして、確かめる",
    "IBM Quantum PlatformやGoogle Colabを使う演習を予定しています。実行環境は事前にご案内します。",
  ],
  [
    "チームで試す",
    "ガイド付き演習のあとはミニハッカソンへ。仲間とアイデアを持ち寄り、コードにします。",
  ],
  ["成果を共有する", "取り組んだテーマや実装、そこから得た発見を発表します。"],
];
const faqs = [
  [
    "量子コンピュータを初めて学びます。参加できますか？",
    "初心者歓迎です。ガイド付きのQiskit演習を予定しています。必要なPythonや数学の知識、事前学習については準備が整い次第ご案内します。",
  ],
  [
    "慶應義塾大学以外の学生や、社会人も参加できますか？",
    "参加対象の詳細は調整中です。確定した条件を、参加登録の開始前に掲載します。",
  ],
  [
    "どちらか1日だけでも参加できますか？",
    "1日のみの参加可否は調整中です。登録フォームでは希望する参加日を確認する予定です。",
  ],
  ["参加費はいくらですか？", "参加費は無料です。"],
  [
    "チームを組んでから申し込む必要がありますか？",
    "チーム形式のミニハッカソンを予定しています。チームの人数や組み方は、確定次第ご案内します。",
  ],
  [
    "会場で写真や動画の撮影はありますか？",
    "登録時に撮影への同意を確認する予定です。撮影の範囲、利用目的、同意しない場合の対応は、登録フォームでご案内します。",
  ],
];

export default function FallFestPage() {
  const registrationOpen =
    event.registrationEnabled && Boolean(event.registrationUrl);
  return (
    <div className={s.page} data-surface="qff-keio">
      <a className={s.skip} href="#main">
        本文へ移動
      </a>
      <header className={s.header}>
        <a
          className={s.ibmBrand}
          href="#event-title"
          aria-label="IBM Quantum — イベントの先頭へ"
        >
          <span aria-hidden="true" />
        </a>
        <nav aria-label="イベント内ナビゲーション">
          <a href="#about">イベント概要</a>
          <a href="#program">プログラム</a>
          <a href="#access">会場</a>
        </nav>
        <a className={s.headerCta} href="#register">
          参加登録<span aria-hidden="true">↗</span>
        </a>
      </header>
      <main id="main">
        <section className={s.hero} aria-labelledby="event-title">
          <div className={s.heroCopy}>
            <h1 id="event-title">
              <span>Qiskit</span>
              <span>Fall Fest</span>
              <span className={s.titleLast}>
                2026 <em>@ Keio</em>
              </span>
            </h1>
            <p className={s.heroMessage}>
              量子コンピュータを、
              <br />
              自分の手で動かす週末。
            </p>
            <div className={s.heroDate}>
              <time dateTime="2026-10-17">
                10.17<small>土</small>
              </time>
              <span className={s.dateSeparator}>/</span>
              <time dateTime="2026-10-18">
                18<small>日</small>
              </time>
            </div>
            <p className={s.heroVenue}>
              慶應義塾大学 AIC<span>対面開催</span>
            </p>
            <a className={s.button} href="#register">
              参加登録<span aria-hidden="true">↗</span>
            </a>
            <p className={s.registrationHint}>
              {registrationOpen
                ? "参加条件をご確認のうえ、お申し込みください。"
                : "参加登録は準備中です。"}
            </p>
          </div>
          <div className={s.heroArt} aria-hidden="true">
            <div className={s.artTop}>
              <span>Qiskit Fall Fest</span>
              <span>Keio / 2026</span>
            </div>
            <Image
              src="/events/qiskit-fall-fest-2026/qiskit.svg"
              alt=""
              width={480}
              height={480}
              priority
              className={s.pictogram}
            />
            <div className={s.artBottom}>
              <span>
                October
                <br />
                17 & 18
              </span>
              <span>
                つくる。試す。
                <br />
                量子で考える。
              </span>
            </div>
          </div>
        </section>
        <section id="about" className={s.about} aria-labelledby="about-title">
          <div>
            <h2 id="about-title">
              はじめの一歩から、
              <br />
              ひとつのアイデアへ。
            </h2>
            <p>
              量子コンピューティングに興味がある。
              <br />
              その気持ちから参加できる、2日間です。
            </p>
          </div>
          <div className={s.aboutBody}>
            <p>
              講演で研究や実践に触れ、Qiskitのハンズオンでコードを書く。ミニハッカソンではチームで考え、試したことを発表する。慶應義塾大学AICで、一緒に量子計算を体験しましょう。
            </p>
            <dl className={s.facts}>
              <div>
                <dt>開催形式</dt>
                <dd>対面</dd>
              </div>
              <div>
                <dt>対象レベル</dt>
                <dd>初心者歓迎</dd>
              </div>
              <div>
                <dt>定員</dt>
                <dd>
                  40〜50名<small>予定</small>
                </dd>
              </div>
            </dl>
          </div>
        </section>
        <section
          id="program"
          className={s.section}
          aria-labelledby="program-title"
        >
          <div className={s.sectionHeading}>
            <h2 id="program-title">登壇者とプログラム</h2>
            <p>研究の視点と、実装の手触りを。</p>
          </div>
          <Program />
        </section>
        <section className={s.experience} aria-labelledby="experience-title">
          <div className={s.experienceHeading}>
            <h2 id="experience-title">
              学ぶだけで、
              <br />
              終わらない。
            </h2>
            <p>
              Qiskitで回路をつくり、
              <br />
              実行結果から次のアイデアへ。
            </p>
            <div className={s.technology}>
              <span>演習で使用予定</span>
              <Image
                src="/events/qiskit-fall-fest-2026/ibm-quantum.png"
                width={200}
                height={77}
                loading="eager"
                unoptimized
                alt="IBM Quantum"
              />
            </div>
          </div>
          <ol className={s.experienceList}>
            {experiences.map(([title, body], index) => (
              <li key={title}>
                <span className={s.stepNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section
          id="access"
          className={s.section}
          aria-labelledby="access-title"
        >
          <div className={s.sectionHeading}>
            <h2 id="access-title">会場と参加の準備</h2>
          </div>
          <div className={s.accessGrid}>
            <div className={s.venue}>
              <span className={s.venueMonogram} aria-hidden="true">
                AIC
              </span>
              <h3>慶應義塾大学 AIC</h3>
              <p>
                {event.venueDetails ??
                  "キャンパス・建物・部屋番号、会場までの経路は、確定次第ご案内します。"}
              </p>
              {event.venueMapUrl && (
                <a href={event.venueMapUrl} className={s.textLink}>
                  アクセスを見る
                </a>
              )}
            </div>
            <div className={s.preparation}>
              <h3>持ち物・PC要件</h3>
              <ul>
                <li>ノートパソコンと充電器</li>
                <li>ブラウザーで演習に参加できる環境</li>
                <li>必要に応じて筆記用具</li>
              </ul>
              <p>
                対応OS、ソフトウェア、必要なアカウントなど、詳しい環境要件は事前にご案内します。
              </p>
            </div>
          </div>
        </section>
        <section
          id="register"
          className={s.registration}
          aria-labelledby="register-title"
        >
          <div>
            <h2 id="register-title">
              この秋は、
              <br />
              量子をつくる側に。
            </h2>
            <p>
              2026年10月17日（土）・18日（日）
              <br />
              慶應義塾大学 AIC / 定員40〜50名（予定）
            </p>
          </div>
          <div className={s.registrationBody}>
            <h3>参加登録</h3>
            {registrationOpen ? (
              <>
                <p>参加条件をご確認のうえ、登録フォームへお進みください。</p>
                <a className={s.button} href={event.registrationUrl!}>
                  参加登録フォームへ<span aria-hidden="true">↗</span>
                </a>
              </>
            ) : (
              <>
                <p className={s.registrationStatus}>登録受付は準備中です</p>
                <p>受付開始まで、もうしばらくお待ちください。</p>
                <button className={s.button} disabled>
                  受付開始をお待ちください
                </button>
              </>
            )}
            <p className={s.formNote}>
              登録フォームで、氏名・所属・メールアドレス・経験・参加希望日・撮影への同意をご回答ください。
            </p>
          </div>
        </section>
        <section id="faq" className={s.faq} aria-labelledby="faq-title">
          <h2 id="faq-title">よくある質問</h2>
          <div>
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <span aria-hidden="true">＋</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={s.closing} aria-label="行動指針とお問い合わせ">
          <div>
            <h2>Code of Conduct</h2>
            <p>行動指針</p>
            <p>
              背景や経験の違いを尊重し、互いの学びを支える場を目指します。ハラスメント、差別的な言動、同意のない撮影や情報公開は認めません。困ったことがあれば、当日の運営スタッフにご相談ください。
            </p>
            <details>
              <summary>行動指針の詳細</summary>
              <p>
                参加者・登壇者・運営スタッフを含む、本イベントに関わるすべての方に、この行動指針を守っていただきます。相手の発言や作業を尊重してください。
              </p>
              <p>
                不適切な行為を見聞きした際や、対応に困った際は、当日の運営スタッフ、または以下のメールアドレスへご相談ください。
                <br />
                <a className={s.textLink} href={`mailto:${event.contactEmail}`}>
                  {event.contactEmail}
                </a>
              </p>
            </details>
          </div>
          <div>
            <h2>お問い合わせ</h2>
            {event.contactEmail ? (
              <a className={s.textLink} href={`mailto:${event.contactEmail}`}>
                {event.contactEmail}
              </a>
            ) : (
              <p>
                イベント専用の問い合わせ先は準備中です。
                <br />
                確定次第、こちらに掲載します。
              </p>
            )}
          </div>
        </section>
        <section className={s.organizations} aria-label="主催・協力">
          <div className={s.host}>
            <h2>主催</h2>
            <ul className={s.hostLogos}>
              <li>
                <Image
                  src="/events/qiskit-fall-fest-2026/keio.svg"
                  alt={event.organizers[0]}
                  width={204}
                  height={48}
                  unoptimized
                />
              </li>
              <li>
                <Image
                  src="/events/qiskit-fall-fest-2026/ibm-quantum-header.png"
                  alt={event.organizers[1]}
                  width={190}
                  height={27}
                  unoptimized
                />
              </li>
            </ul>
          </div>
          <div className={s.supporters}>
            <h2>協力</h2>
            <ul className={s.partnerLogos}>
              <li>
                <span role="img" aria-label={event.supporters[0]}>
                  <LeonaWordmark className={s.partnerLeona} />
                </span>
              </li>
              <li>
                <Image
                  src="/events/qiskit-fall-fest-2026/quanmatic.svg"
                  alt={event.supporters[1]}
                  width={190}
                  height={23}
                  unoptimized
                />
              </li>
              <li>
                <Image
                  src="/events/qiskit-fall-fest-2026/blueqat.png"
                  alt={event.supporters[2]}
                  width={148}
                  height={37}
                  unoptimized
                />
              </li>
            </ul>
          </div>
        </section>
      </main>
      <footer className={s.footer}>
        <a href="/" className={s.brand} aria-label="Leona Quantum ホーム">
          <LeonaWordmark className={s.footerLeona} />
        </a>
        <p>Qiskit Fall Fest 2026 @ Keio</p>
        <a href="#event-title">ページの先頭へ ↑</a>
      </footer>
    </div>
  );
}
