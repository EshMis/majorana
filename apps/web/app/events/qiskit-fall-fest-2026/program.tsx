"use client";

import { useState } from "react";
import { days } from "./event";
import s from "./page.module.css";

export function Program() {
  const [selected, setSelected] = useState(0);
  const day = days[selected];
  return (
    <div className={s.program}>
      <div className={s.dayButtons} aria-label="表示する開催日">
        {days.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected === index}
            aria-controls="day-program"
            onClick={() => setSelected(index)}
          >
            <span>
              {item.date}
              <small>（{item.weekday}）</small>
            </span>
            <span>{item.english}</span>
          </button>
        ))}
      </div>
      <div
        id="day-program"
        className={s.dayPanel}
        aria-live="polite"
        aria-atomic="true"
      >
        <h3>
          {day.date}（{day.weekday}）のプログラム（予定）
        </h3>
        <p className={s.dayIntro}>{day.description}</p>
        <ol className={s.schedule} aria-label="当日の流れ">
          {day.schedule.map((session) => (
            <li key={session.title}>
              <p className={s.sessionPeriod}>{session.period}</p>
              <div>
                <h4>{session.title}</h4>
                <p>{session.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className={s.programNote}>
          昼食・休憩を挟んで進行します。開始・終了時刻と各プログラムの順序・時間配分は調整中です。
        </p>
        <h3 className={s.speakersHeading}>この日の登壇予定</h3>
        {day.speakers.map((speaker) => (
          <article className={s.speaker} key={speaker.name}>
            <div>
              <p className={s.affiliation}>
                {speaker.affiliation === "教授" ||
                speaker.affiliation === "先生"
                  ? "Guest speaker"
                  : speaker.affiliation}
              </p>
              <h4>
                {speaker.name}
                <small>
                  {speaker.affiliation === "教授" ||
                  speaker.affiliation === "先生"
                    ? speaker.affiliation
                    : "氏"}
                </small>
              </h4>
            </div>
            <div>
              <p className={s.talkTitle}>{speaker.title}</p>
              <p className={s.pending}>{speaker.note}</p>
            </div>
          </article>
        ))}
        <p className={s.programNote}>
          登壇者・講演内容は変更になる場合があります。確定次第、このページでお知らせします。
        </p>
      </div>
    </div>
  );
}
