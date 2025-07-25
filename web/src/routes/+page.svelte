<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Solution, ModSearchMetadata, ModRepositoryName, MCVersion } from 'mclib';
	import { ModLoader } from 'mclib';
	import { ModSearch, ModsList, ToggleButtons, MCVersionSelection, FileDropZone } from '$cmpts';
	import * as m from '$msg';
	import * as config from '../config';

	let search_name_input = $state('');
	let is_loading_search = $state(false);
	let search_results: [ModRepositoryName, ModSearchMetadata][] = $state([]);

	let mod_list_added: ModSearchMetadata[] = $state([]);

	function add_mod_to_list(mod: ModSearchMetadata): void {
		if (!mod_list_added.includes(mod)) {
			// add mod to list of mods to use
			mod_list_added.push(mod);
			//empty search results list
			search_results = [];
		}
	}

	function remove_mod_from_list(mod: ModSearchMetadata): void {
		const index_mod = mod_list_added.indexOf(mod);
		if (index_mod > -1) {
			mod_list_added.splice(index_mod, 1);
		}
	}

	let loaders_selected: ModLoader[] = $state([]);

	let mc_version_range: { min: MCVersion; max: MCVersion } = $state({
		min: '',
		max: ''
	});

	let mc_version_list: MCVersion[] = $state([]);

	$effect.pre(() => {
		config.modQueryService.getMinecraftVersions().then((values) => {
			mc_version_list = values;
			mc_version_range = {
				min: mc_version_list[0],
				max: mc_version_list[mc_version_list.length - 1]
			};
		});
	});

	let mc_results: Solution | null = $state(null);
	let show_raw_data = $state(false);

	let is_loading_mccreator = $state(false);
	let error: string | null = $state(null);

	async function runModpackCreator() {
		try {
			if (mod_list_added.length < 1) {
				throw new Error(m['runner.error_no_mod_added']());
			}
			// Reset state
			mc_results = null;
			error = null;
			is_loading_mccreator = true;

			let solutions = await config.solutionFinder.findSolutions(mod_list_added.map((mod) => mod.id), {
				minVersion: mc_version_range.min,
				maxVersion: mc_version_range.max,
				loaders: loaders_selected.length > 0 ? loaders_selected : undefined
			});
			mc_results = solutions[0];
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'Unknown error';
			}
			console.error(err);
		} finally {
			is_loading_mccreator = false;
		}
	}
</script>

<h1>{m['about.name']()}</h1>

<section>
	<h2>{m['add_mods.zone_title']()}</h2>

	<ModSearch bind:search_name_input bind:search_results bind:is_loading_search {add_mod_to_list} />

	<FileDropZone {add_mod_to_list} />

	{#if mod_list_added.length > 0}
		<h3 transition:slide={{ axis: 'y', duration: 200 }}>{m['add_mods.mods_selected']()}</h3>
	{/if}

	<ModsList bind:mod_list_added {remove_mod_from_list} />
</section>

<section>
	<h2>{m['filter.zone_title']()}</h2>

	<ToggleButtons
		bind:selection={loaders_selected}
		entries_list={Object.values(ModLoader)}
		name="loaders-selection"
		reset
	/>

	<MCVersionSelection
		mc_versions={mc_version_list}
		bind:min_mc_version={mc_version_range.min}
		bind:max_mc_version={mc_version_range.max}
	/>
</section>

<button
	id="run_modpack_creator"
	onclick={runModpackCreator}
	disabled={is_loading_mccreator || mod_list_added.length < 1}
>
	{#if is_loading_mccreator}
		{m['runner.processing_modpack_creator']()}
	{:else}
		{m['runner.run_modpack_creator']()}
	{/if}
</button>

{#if error || is_loading_mccreator || mc_results}
	<section transition:slide={{ axis: 'y', duration: 200 }}>
		{#if error}
			<p>{m['runner.error_while_calculating']()}: {error}</p>
		{:else if is_loading_mccreator}
			<p>{m['runner.processing_modpack_creator']()}</p>
		{:else if mc_results}
			<h2>{m['runner.result']()}:</h2>
			<h3 class="font-bold">Best Minecraft Configuration:</h3>
			<p>Version: {mc_results.mcConfig.mcVersion}</p>
			<p>Loader: {mc_results.mcConfig.loader}</p>

			<h3 class="mt-4 font-bold">Compatible Mods:</h3>
			<ul class="ml-6 list-disc">
				{#each mc_results.mods as mod (mod.release)}
					<li>
						<strong>{mod.name}</strong>: {mod.release.modVersion}
						<ul class="list-circle ml-4 text-sm">
							<li>Loaders: {mod.release.loaders.join(', ')}</li>
							<li>MC Versions: {mod.release.mcVersions.join(', ')}</li>
						</ul>
					</li>
				{/each}
			</ul>

			<input type="checkbox" bind:checked={show_raw_data} name="show_raw_data" />
			<label for="show_raw_data">{m['runner.show_raw_data']()}</label>

			{#if show_raw_data}
				<pre>{JSON.stringify(mc_results, null, 2)}</pre>
			{/if}
		{/if}
	</section>
{/if}

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		width: 100%;
		gap: 1rem;
		padding: 2rem;
		border: solid 1px var(--grey-dark-1);
	}
	button#run_modpack_creator {
		color: var(--grey-dark-2);
		background-color: var(--green);
		border: solid 2px var(--green);
		&:is(:active, :hover, :focus, :focus-visible) {
			border-color: var(--green-light-1);
		}
		padding: 1rem 2rem;
		font-size: 18px;
		width: max-content;
		&:disabled {
			background-color: var(--grey);
			border-color: var(--grey);
		}
	}
</style>
