# Content Guide

PyLearn is **content-driven**: every lesson, quiz, and flashcard lives in a JSON
file under `src/content/`. Adding a topic means adding a JSON file and one line
to the registry — **no component changes**. This guide shows the format with a
complete, copyable example.

---

## Where content lives

```
src/content/
  subjects.json        # the registry: subjects + module order
  python/
    variables.json     # one file per module (topic)
    strings.json
    ...
```

- **`subjects.json`** lists each subject and the **ordered** ids of its modules.
- Each **module JSON** holds one topic: a lesson, a quiz, and flashcards.

At runtime the app reads content from **Supabase** when it's configured, falling
back to these JSON files otherwise. The JSON files are always the *authoring
source of truth* — run `npm run sync:content` to push them to Supabase
(see `README.md`).

---

## Adding a new topic — 3 steps

1. Create `src/content/<subject>/<topic>.json` (use the template below).
2. Register it:
   - **`subjects.json`** → add the topic id to that subject's `modules` array.
   - **`src/content/manifest.ts`** → `import` the new file and add it to
     `moduleFiles` (this is what bundles it for the offline fallback).
3. If you use Supabase, run `npm run sync:content`.

That's it. The curriculum tree, lesson viewer, quiz runner, flashcards, and
dashboard all pick it up automatically.

---

## Module JSON shape

| Field         | Type                              | Notes |
|---------------|-----------------------------------|-------|
| `id`          | string                            | URL-safe, unique. Used in routes (`/module/<id>`). |
| `title`       | string                            | Shown on cards and headers. |
| `level`       | `"beginner" \| "intermediate" \| "advanced"` | Groups the module on the home screen. |
| `description` | string                            | One-line blurb for the curriculum card. |
| `lesson`      | Lesson                            | See below. |
| `quiz`        | Quiz                              | See below. |
| `flashcards`  | Flashcard[]                       | ~5 recommended. |

### Lesson

| Field              | Type          | Notes |
|--------------------|---------------|-------|
| `id`               | string        | Unique. |
| `title`            | string        | |
| `summary`          | string        | One sentence. |
| `body`             | string (Markdown) | GitHub-flavoured Markdown. Fenced code blocks get syntax highlighting. Use `\n` for newlines. |
| `examples`         | CodeExample[] | Optional. Each opens an interactive Pyodide playground. |
| `estimatedMinutes` | number        | Optional, UI only. |

**CodeExample**: `{ "title": string, "code": string, "description"?: string }`

### Quiz

`{ "id": string, "title": string, "questions": Question[] }`

**Question**

| Field         | Type                                   | Notes |
|---------------|----------------------------------------|-------|
| `id`          | string                                 | Unique within the quiz. |
| `kind`        | `"multiple-choice" \| "predict-output"` | Both use a pick-an-option UI. For `predict-output`, put a code block in `prompt` and make `options` candidate outputs. |
| `prompt`      | string (Markdown)                      | May embed a code block. |
| `options`     | string[]                               | The choices. |
| `answerIndex` | number                                 | 0-based index of the correct option. |
| `explanation` | string                                 | Optional; shown after answering. |

### Flashcard

`{ "id": string, "front": string, "back": string }` — both sides support Markdown.

---

## Full copyable example

Save as `src/content/python/example-topic.json`, then register it (step 2 above).

```json
{
  "id": "example-topic",
  "title": "Example Topic",
  "level": "beginner",
  "description": "A template you can copy to create a new lesson.",
  "lesson": {
    "id": "example-topic",
    "title": "Example Topic",
    "summary": "Shows every content feature in one place.",
    "estimatedMinutes": 5,
    "body": "## A heading\n\nNormal text with `inline code` and a fenced block:\n\n```python\nprint(\"hello\")\n```\n\n- bullet one\n- bullet two\n",
    "examples": [
      {
        "title": "A runnable snippet",
        "description": "Press Run to execute this in your browser.",
        "code": "name = \"world\"\nprint(f\"hello, {name}\")"
      }
    ]
  },
  "quiz": {
    "id": "example-topic-quiz",
    "title": "Example Topic — Quiz",
    "questions": [
      {
        "id": "ex-q1",
        "kind": "multiple-choice",
        "prompt": "Which function prints to the screen?",
        "options": ["echo", "print", "log", "say"],
        "answerIndex": 1,
        "explanation": "Python uses print()."
      },
      {
        "id": "ex-q2",
        "kind": "predict-output",
        "prompt": "What does this print?\n\n```python\nprint(2 + 3)\n```",
        "options": ["23", "5", "Error", "2 + 3"],
        "answerIndex": 1,
        "explanation": "2 + 3 evaluates to 5."
      }
    ]
  },
  "flashcards": [
    { "id": "ex-f1", "front": "How do you print in Python?", "back": "`print(value)`." },
    { "id": "ex-f2", "front": "What does an f-string do?", "back": "Embeds expressions in a string: `f\"{x}\"`." }
  ]
}
```

---

## Tips & gotchas

- **JSON has no multi-line strings.** Write newlines as `\n` and escape inner
  double quotes as `\"`. (If you find this tedious, you can author in a `.ts`
  file exporting the same shape — the types live in `src/types/content.ts`.)
- **Keep ids stable.** Progress, quiz history, and flashcard schedules are keyed
  by id. Renaming an id resets that item's saved state.
- **`answerIndex` is 0-based.** The first option is index `0`.
- **Content is trusted** and rendered as Markdown, so only put content you
  authored here.
- After editing, run `npm run build` — TypeScript validates each file against
  the schema in `manifest.ts` and will flag shape mistakes.
