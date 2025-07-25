#!/usr/bin/env bun

import { Command } from 'commander';
import { ModQueryService } from 'mclib';

const program = new Command();

program
  .name('modpack-cli')
  .description('CLI for managing modpacks')
  .version('0.0.1');

program
  .command('create')
  .description('Create a new modpack')
  .option('--mod-name <modName...>', 'Mod IDs to include in the modpack')
  .option('--min-version <version>', 'Minimum version of the modpack')
  .option('--loader <loader...>', 'Loaders to support (e.g., forge, fabric)')
  .action(async (options) => {
    const { modName, minVersion, loader } = options;

    if (!modName || modName.length === 0) {
      console.error('Error: At least one --mod-name is required.');
      process.exit(1);
    }

    if (!minVersion) {
      console.error('Error: --min-version is required.');
      process.exit(1);
    }

    if (!loader || loader.length === 0) {
      console.error('Error: At least one --loader is required.');
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all modpacks')
  .action(() => {
    // TODO
  });

program.parse(process.argv);
