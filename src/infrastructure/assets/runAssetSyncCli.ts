import { pullAssets, pushAssets } from './assetSync';

/**
 * Parses `assets:push` / `assets:pull` CLI argv.
 * @param argv - Process arguments after the node/vite-node entry (e.g. `['push']`).
 * @returns `'push'` or `'pull'` for the corresponding npm script.
 */
function resolveAssetSyncCliCommand(argv: readonly string[]): 'push' | 'pull' {
  const command = argv[0];
  if (command === 'push' || command === 'pull') {
    return command;
  }
  throw new Error(`Expected push or pull, got: ${argv.join(' ')}`);
}

async function main(): Promise<void> {
  const command = resolveAssetSyncCliCommand(process.argv.slice(2));
  if (command === 'push') {
    await pushAssets();
    return;
  }
  await pullAssets();
}

void main();
