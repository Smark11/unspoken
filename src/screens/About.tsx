import { navigate } from '../lib/router'
import { BackIcon } from '../components/Icons'
import { Mark } from '../components/Logo'

const MARKETING_PLAN = 'https://claude.ai/code/artifact/dc288127-c8e3-4b89-8c01-bd00047aa13e'
const REPO = 'https://github.com/Smark11/unspoken'

export function About() {
  return (
    <div className="screen about">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate({ name: 'home' })}><BackIcon /></button>
      </div>

      <div className="about-hero">
        <div className="about-mark"><Mark size={64} /></div>
        <h1 className="hero-title">Words you know.<br /><em>Learn to say them.</em></h1>
        <p className="tagline">Unspoken is a private pronunciation coach for the exact words you choose.</p>
      </div>

      <section className="about-card creator">
        <div className="eyebrow">Created by</div>
        <div className="creator-name">Amy Senerth</div>
        <p>
          Unspoken is Amy's idea: the name, the tagline and the six-step loop at the heart of it. Her brief was
          deliberately small. Type ten words. Hear each one. Say it. Find out whether it landed. Move on. Come back
          tomorrow for a quick review. And resist adding anything else until that loop works beautifully.
        </p>
        <p>
          The line that shapes every screen is hers too: the app doesn't test whether you know what a word means.
          It only cares whether you're comfortable saying it.
        </p>
      </section>

      <section className="about-section">
        <h2>How it works</h2>
        <ol className="steps">
          <li><b>Create a list.</b> Type or paste up to ten words. Any words: medical terms, names, the dish you never order out loud.</li>
          <li><b>Learn.</b> Hear a reliable pronunciation at normal or slow speed, in the accent you choose.</li>
          <li><b>Speak.</b> Tap the orb and say it. The meter shows you being heard.</li>
          <li><b>Get feedback.</b> Got it, or Almost with one concrete tip. Never a score to decode.</li>
          <li><b>Advance.</b> When a word lands, the next one arrives on its own.</li>
          <li><b>Finish and keep.</b> The list stays in your library, and mastered words return for a short review after a day, then three, then a week.</li>
        </ol>
      </section>

      <section className="about-section">
        <h2>Who it's for</h2>
        <p>
          People who read a hard word every day and quietly avoid saying it. Clinicians and nursing students before
          rounds. Fluent readers of English who hesitate to speak it. Presenters, teachers and hosts with a list of
          names to get right. The first audience is healthcare learners, because the vocabulary is dense and a
          student can name ten words they dread in under a minute.
        </p>
      </section>

      <section className="about-section">
        <h2>The plan</h2>
        <p>
          Free gets you one list of ten at a time with listening and evaluation, enough to prove the loop with no
          sign-up. <b>Plus</b>, at $4.99 a month or $29.99 a year, adds unlimited lists, spaced review, finer
          pronunciation tips, premium voices and shareable lists. A per-seat <b>Programs</b> tier is planned for
          nursing and medical cohorts.
        </p>
        <p>
          Launch is narrow and in person: twenty hand-picked testers, then student groups, then instructors, with
          the shareable list as the growth loop. Paid acquisition waits until people who finish a list come back a
          week later.
        </p>
        <a className="link-card" href={MARKETING_PLAN} target="_blank" rel="noopener">
          <span><b>Read the full marketing plan</b><span className="small muted">Audiences, positioning, monetization, channels, metrics, 90-day timeline, risks</span></span>
          <span className="chev">›</span>
        </a>
      </section>

      <section className="about-section">
        <h2>Under the hood</h2>
        <p>
          Everything runs on your phone. Lists and progress never leave the device. Hearing and listening use the
          voices built into your browser, or a studio voice service when one is connected in Settings. The build
          plan describes the path to true pronunciation assessment, and the design notes record every visual
          decision.
        </p>
        <div className="link-list">
          <a className="link-card" href={`${REPO}/blob/main/PLAN.md`} target="_blank" rel="noopener"><span><b>Build plan</b><span className="small muted">Phases, architecture, speech vendors, costs</span></span><span className="chev">›</span></a>
          <a className="link-card" href={`${REPO}/blob/main/DESIGN.md`} target="_blank" rel="noopener"><span><b>Design notes</b><span className="small muted">Tokens, type, layout, five design passes</span></span><span className="chev">›</span></a>
          <a className="link-card" href={REPO} target="_blank" rel="noopener"><span><b>Source on GitHub</b><span className="small muted">Open source, MIT-style use welcome</span></span><span className="chev">›</span></a>
        </div>
      </section>

      <p className="about-foot small muted">Product by Amy Senerth. Built by Mark Senerth with Claude Code. Version 0.1, September 2026.</p>
    </div>
  )
}
