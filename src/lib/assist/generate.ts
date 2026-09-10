import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { brief, type Brief } from "./brief";

/**
 * Turning a paragraph about yourself into portfolio copy.
 *
 * Present only when ANTHROPIC_API_KEY is set — the same rule the sign-in
 * providers follow: a capability the server can't perform is not offered, so
 * the button and the capability can never disagree.
 *
 * Structured outputs rather than "reply with JSON": the model is constrained to
 * the schema on the way out, and the result is parsed against the same schema
 * again here. Nothing reaches a document without passing both.
 */

export const ASSIST_ENABLED = Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM = `You write the copy for one-page personal portfolio sites.

You are given whatever the person could be bothered to type about themselves —
often a rough paragraph, sometimes a CV, sometimes three words. Turn it into the
content of a portfolio.

Rules:
- Write only from what you are given. Do not invent employers, job titles,
  dates, clients, metrics, degrees or projects. If they didn't say it, it isn't
  on their page. Thin input means a short page, and a short page is the correct
  answer.
- Omit a section rather than padding it. Four sections that say something beat
  seven that don't.
- The headline is the one line at the top of the page. Make it a claim about
  what they do, not a job title. Wrap at most two or three words in ==double
  equals== to paint them in the site's accent colour: "I build ==fast==,
  reliable web software". Use that markup nowhere else.
- Write in the person's own register. If their input is plain, stay plain. No
  "passionate about leveraging synergies", no em-dash-strewn LinkedIn voice.
- Second person is wrong and third person is worse: write as they would write
  about themselves, in the first person where a pronoun is needed at all.
- \`initials\` is one or two letters for the monogram in the nav.
- Capability icons must come from the allowed list, and should match the
  capability rather than being picked in order.
- A projects section needs real projects. If they described none, leave it out.

Order sections the way the page should read, top to bottom. A contact section,
if there is one, goes last.

Each section is one of these, and carries only that type's fields:
  about         title, lead, body
  projects      title, items[{title, summary, tech[], year, status, href}]
  experience    title, items[{role, org, start, end, summary, bullets[]}]
  education     title, items[{qualification, institution, start, end, summary}]
  skills        title, groups[{label, items[]}]
  capabilities  title, items[{icon, title, body}]
  stats         title, items[{value, suffix, label}]
  text          title, body
  contact       title, headline, blurb

Where a field has no value, send null — never an empty string and never a
placeholder.`;

export type GenerateResult =
  | { ok: true; brief: Brief }
  | { ok: false; error: string };

export async function generateBrief(about: string): Promise<GenerateResult> {
  if (!ASSIST_ENABLED) return { ok: false, error: "This server has no ANTHROPIC_API_KEY set." };

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      output_config: { format: zodOutputFormat(brief) },
      messages: [{ role: "user", content: about }],
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "The model declined to write this. Try describing yourself differently." };
    }
    if (response.stop_reason === "max_tokens") {
      return { ok: false, error: "The answer was cut off. Try a shorter description." };
    }

    // parsed_output is null when the response didn't parse; re-parsing here is
    // not redundant — it is what makes the value safe to trust downstream, and
    // it keeps this function honest if the helper's behaviour ever changes.
    const parsed = brief.safeParse(response.parsed_output);
    if (!parsed.success) {
      return { ok: false, error: "The generated content didn't fit the portfolio schema. Try again." };
    }

    return { ok: true, brief: parsed.data };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Rate limited by the model API. Try again in a minute." };
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "The server's ANTHROPIC_API_KEY was rejected." };
    }
    if (error instanceof Anthropic.APIError) {
      return { ok: false, error: `The model API returned ${error.status}.` };
    }
    throw error;
  }
}
