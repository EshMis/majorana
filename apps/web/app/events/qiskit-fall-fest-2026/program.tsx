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
          {day.date}（{day.weekday}）の登壇予定
        </h3>
        <p className={s.dayIntro}>{day.description}</p>
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
          講演の順序・開始時刻、ハンズオンやハッカソンの時間配分は調整中です。確定次第、このページでお知らせします。
        </p>
      </div>
    </div>
  );
}
