# INCRMD 🔺

INCRMD 🔺 is an experiment exploring a different approach to interacting with 🤖 AI coding tools such as Codex, Claude Code, or OpenCode.

The common way of working with these tools is to request changes through chat. Each prompt describes what the AI should modify and what the desired next state should be. However, during this process the AI can lose track of the final expected state, especially when assumptions change over time.

INCRMD proposes a different approach. Instead of continuously issuing chat prompts, the workflow relies on editing only `PROJECT.md`, which contains the project specification. INCRMD monitors changes and sends the AI only what was modified during the latest edit of `PROJECT.md`. This way, the AI always has the full project description in a single place and can clearly see what changed. INCRMD includes both the previous version and the updated version of the description in the prompt sent to the AI.

Over time, `PROJECT.md` grows with **increasingly detailed descriptions of the project**.

How it works?

```
INCRMD watches PROJECT.md
|
|_ (change detected 🔺) ---> send diff to AI
|_ (change detected 🔺) ---> send diff to AI
...
```

## Supported AI coding tools

- ✅ Codex

## How to Start

- Check if you have Codex installed and that you are logged in: `codex --version`
- Install INCRMD: `npm install -g incrmd`
- Open an empty project folder and run: `incrmd`.
- Start editing PROJECT.md. **Every time you save this file 🔺, the AI will make changes**.

## Comparision

|                             | Codex / Claude Code / OpenCode                                                                                                                                                                     | INCRMD                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Way of working              | Requesting precise codebase changes through chat                                                                                                                                                   | Updating a detailed project description in the `PROJECT.md` file                                |
| Where is the specification? | In the developer's mind; sometimes parts of the specification are stored in Markdown files                                                                                                         | The specification is written entirely in `PROJECT.md`                                           |
| Precision of description    | Across different prompts, the description of a feature may become distorted. One prompt may request A, while another requests B, which may contradict A. The AI can lose the intended final state. | Precision remains high because every aspect of the desired final state is explicitly described. |
| Precision over time         | Decreases                                                                                                                                                                                          | Increases as `PROJECT.md` becomes more detailed                                                 |

## 💡 License

This project is released under the MIT license.
