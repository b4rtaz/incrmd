#!/usr/bin/env node

import { Codex } from '@openai/codex-sdk';
import { createTwoFilesPatch } from 'diff';
import path from 'path';
import fs from 'fs';

const INIT_PROMPT =
  `You are INCRMD, an AI assistant for developers. ` +
  `You don't expect user requests that instruct what to change in the code, but you base on the PROJECT.md file that contains the precisely defined requirements for the project. ` +
  `Your role is to keep the codebase up to date with the requirements defined in the PROJECT.md file. You DON'T introduce features that are not defined in the PROJECT.md file. ` +
  `I'll let you know when the PROJECT.md file is updated, and I will request you to update the codebase accordingly. ` +
  `If I don't ask you to update the codebase, you can assume that the codebase is up to date with the requirements defined in the PROJECT.md file. ` +
  `My requests will contain the diff of the PROJECT.md file, so you can understand what has changed in the requirements. ` +
  `Before you start implementing the changes, you MUST create a plan for the implementation. For example, if the PROJECT.md file describes some feature, and the change introduces a new requirement for that feature, you can plan to implement the change by updating the code related to that feature. ` +
  `You can also observe changes that changes only a part of feature. By this you KNOW what is the current state of the codebase, and you know what is desired state of the codebase. By this you can plan the implementation by only changing the part of the code that is related to the change in the requirements. ` +
  `You have FULL ACCESS to update the PROJECT.md file to make it more clear and precise. Additionally, you can add pointers in the PROJECT.md file to understand where the feature is implemented in the codebase. Even this pointer may include line number. For example:\n` +
  `- Some description of the feature (implemented in: \`src/folder/cls.tx:1204\`)\n` +
  `Ok, now please ready PROJECT.md file and confirm by saying "I'm ready".`;

const DELTA_PROMPT = `The PROJECT.md file has been updated. Here is the diff:\n\n\`\`\`diff\n{diff}\n\`\`\`\n\nPlease update the codebase. Please read again the PROJECT.md file ONLY IF the change is not clear.`;

const EMPTY_PROJECT_MD_CONTENT = `# Project

This project is not started yet. Please define the requirements for the project in this file.`;

async function main() {
  switch (process.argv[2]) {
    case '--help':
    case '-h':
      console.log('Usage: incrmd');
      return;
  }

  const dir = path.resolve(process.cwd());
  const mdPath = path.join(dir, 'PROJECT.md');
  console.log('▗▄▄▄▖▗▖  ▗▖ ▗▄▄▖▗▄▄▖ ▗▖  ▗▖▗▄▄▄  ');
  console.log('  █  ▐▛▚▖▐▌▐▌   ▐▌ ▐▌▐▛▚▞▜▌▐▌  █ ');
  console.log('  █  ▐▌ ▝▜▌▐▌   ▐▛▀▚▖▐▌  ▐▌▐▌  █ ');
  console.log('▗▄█▄▖▐▌  ▐▌▝▚▄▄▖▐▌ ▐▌▐▌  ▐▌▐▙▄▄▀ ');
  console.log();
  console.log(`🔺 Project: ${mdPath}`);
  console.log();

  const codex = new Codex();
  const thread = codex.startThread({
    workingDirectory: dir,
    skipGitRepoCheck: true,
    approvalPolicy: 'never',
    sandboxMode: 'workspace-write'
  });
  let mdContent = null;
  let newMdContent = null;
  let hourglass = true;

  function readProject() {
    return fs.readFileSync(mdPath, 'utf-8');
  }

  if (!fs.existsSync(mdPath)) {
    mdContent = EMPTY_PROJECT_MD_CONTENT;
    fs.writeFileSync(mdPath, EMPTY_PROJECT_MD_CONTENT);
  } else {
    mdContent = readProject();
  }

  async function run(prompt) {
    console.log('💬 Requesting...');

    const { events } = await thread.runStreamed(prompt);
    for await (const event of events) {
      switch (event.type) {
        case 'item.completed':
          if (event.item.type === 'agent_message') {
            console.log(`🤖 ${event.item.text}`);
          } else if (event.item.type === 'reasoning') {
            console.log(`🧠 ${event.item.text}`);
          } else if (event.item.type === 'command_execution') {
            console.log(`⚙️ ${event.item.command}`);
          } else if (event.item.type === 'file_change') {
            for (const change of event.item.changes) {
              console.log(`📝 ${change.kind.toUpperCase()} ${change.path}`);
            }
          } else if (event.item.type === 'error') {
            console.error(`🚨 ${event.item.text}`);
          }
          break;
        case 'turn.completed': {
          const tc = event;
          console.log(`💸 Input=${tc.usage.input_tokens}, Cache=${tc.usage.cached_input_tokens}, Output=${tc.usage.output_tokens}`);
          break;
        }
      }
    }
  }

  function createDeltaPrompt(oldContent, newContent) {
    let patch = createTwoFilesPatch('old PROJECT.md', 'new PROJECT.md', oldContent, newContent, '', '', { context: 3 });
    patch = patch.replace(/^=+\n/, '');
    return {
      patch,
      prompt: DELTA_PROMPT.replace('{diff}', patch)
    };
  }

  await run(INIT_PROMPT);

  fs.watch(mdPath, { encoding: 'utf-8' }, () => {
    const recentMdContent = readProject();
    if (recentMdContent !== mdContent) {
      newMdContent = recentMdContent;
    }
  });

  async function check() {
    if (newMdContent === null) {
      if (hourglass) {
        hourglass = false;
        console.log('⏳ Waiting for changes in PROJECT.md...');
      }
      setTimeout(check, 500);
      return;
    }

    const { patch, prompt } = createDeltaPrompt(mdContent, newMdContent);
    mdContent = newMdContent;
    newMdContent = null;
    hourglass = true;

    try {
      console.log('🚀 Detected changes in PROJECT.md!');
      console.log('―'.repeat(40));
      console.log(patch);
      console.log('―'.repeat(40));
      await run(prompt);
    } catch (e) {
      console.error(`🚨 Failed to update the codebase: ${e?.message || e}`);
    }
    setTimeout(check, 1_000);
  }

  check();
}

main().catch(e => {
  console.error(`🚨 Unexpected error: ${e?.message || e}`);
  process.exit(1);
});
