<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import sample from '../public/sample-workspace.json'
import StudioHeader from './components/StudioHeader.vue'
import DataTools from './components/DataTools.vue'
import AppDialog from './components/AppDialog.vue'
import RecipeSummary from './components/RecipeSummary.vue'
import { parse, serialize, ratioInput, csvExport, textExport } from './domain/recipe.ts'
import { useRecipeScale } from './composables/useRecipeScale.ts'
import { useDraft } from './services/draft.ts'
import { download } from './services/files.ts'
const { draft, storageStatus } = useDraft('vue-baker-ratio-desk:v1', parse(sample), parse),
  scaled = useRecipeScale(draft),
  identity = computed(() => serialize(draft.value).provenance.marker),
  selected = ref(draft.value.ingredients[0]?.id ?? ''),
  chosen = computed(() => draft.value.ingredients.find((r) => r.id === selected.value))
const title = ref(draft.value.name),
  flour = ref(draft.value.flour),
  target = ref<string | number>(draft.value.target),
  portions = ref<string | number>(draft.value.portions),
  ingredientName = ref(chosen.value?.name ?? ''),
  ratio = ref<string | number>((chosen.value?.ratio ?? 0) / 10),
  error = ref(''),
  ingredientError = ref(''),
  about = ref(false),
  remove = ref(false)
function syncSettings() {
  title.value = draft.value.name
  flour.value = draft.value.flour
  target.value = draft.value.target
  portions.value = draft.value.portions
  error.value = ''
}
function syncIngredient() {
  ingredientName.value = chosen.value?.name ?? ''
  ratio.value = (chosen.value?.ratio ?? 0) / 10
  ingredientError.value = ''
}
watch(
  () =>
    JSON.stringify([draft.value.name, draft.value.flour, draft.value.target, draft.value.portions]),
  syncSettings,
)
watch(() => JSON.stringify(chosen.value), syncIngredient)
function replace(value: unknown) {
  const next = parse(value)
  selected.value = next.ingredients[0]?.id ?? ''
  draft.value = next
  syncSettings()
  syncIngredient()
  remove.value = false
}
function number(v: string | number) {
  return typeof v === 'number' ? v : v.trim() ? Number(v) : NaN
}
function save() {
  try {
    draft.value = parse({
      ...draft.value,
      name: title.value,
      flour: flour.value,
      target: number(target.value),
      portions: number(portions.value),
    })
    syncSettings()
  } catch (e) {
    error.value = (e as Error).message
  }
}
function saveIngredient() {
  if (!chosen.value) return
  try {
    draft.value = parse({
      ...draft.value,
      ingredients: draft.value.ingredients.map((r) =>
        r.id === selected.value
          ? { ...r, name: ingredientName.value, ratio: ratioInput(ratio.value) }
          : r,
      ),
    })
    syncIngredient()
  } catch (e) {
    ingredientError.value = (e as Error).message
  }
}
function add() {
  if (draft.value.ingredients.length >= 10) return
  let n = 1
  while (draft.value.ingredients.some((r) => r.id === 'ingredient-' + n)) n++
  const row = { id: 'ingredient-' + n, name: 'New ingredient', ratio: 10 }
  draft.value = parse({ ...draft.value, ingredients: [...draft.value.ingredients, row] })
  selected.value = row.id
  syncIngredient()
}
function deleteIngredient() {
  draft.value = parse({
    ...draft.value,
    ingredients: draft.value.ingredients.filter((r) => r.id !== selected.value),
  })
  selected.value = draft.value.ingredients[0]?.id ?? ''
  syncIngredient()
  remove.value = false
}
function exportCsv() {
  download(identity.value + '-ingredients.csv', csvExport(draft.value), 'text/csv;charset=utf-8')
}
function exportText() {
  download(identity.value + '-batch.txt', textExport(draft.value), 'text/plain;charset=utf-8')
}
</script>
<template>
  <div data-project="vue-baker-ratio-desk" class="min-h-screen">
    <StudioHeader
      title="Baker Ratio Desk"
      subtitle="A familiar recipe, exactly the right batch"
      code="BR"
      ><DataTools
        :workspace="draft"
        :sample="sample"
        :parse="parse"
        :serialize="serialize"
        @replace="replace"
      /><button class="bg-surface hover:bg-soft" @click="about = true">About</button></StudioHeader
    >
    <main class="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8">
      <section class="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div class="min-w-0 max-w-2xl">
          <p class="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
            THE FLOUR IS THE REFERENCE
          </p>
          <h1 class="break-words font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {{ draft.name }}
          </h1>
          <p class="mt-3 max-w-xl leading-relaxed text-muted">
            Set the dough you need, keep the recipe’s proportions, and weigh a batch whose grams add
            up. Divide it into portions without losing a gram.
          </p>
        </div>
        <div class="rounded-xl border border-line bg-surface px-4 py-3 text-right">
          <span class="block font-mono text-xs text-accent" data-ui="marker">{{ identity }}</span
          ><span class="mt-1 block text-xs text-muted" role="status">{{ storageStatus }}</span>
        </div>
      </section>
      <div
        data-ui="workspace"
        class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]"
      >
        <section
          class="flex h-[1130px] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          data-ui="editor-panel"
        >
          <div class="border-b border-line p-5">
            <h2 class="text-lg font-semibold">Keep the recipe, change the batch</h2>
            <p class="mt-1 text-xs text-muted">100% base flour · ratios to one decimal place</p>
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-auto p-5">
            <form @submit.prevent="save" novalidate data-ui="settings-form">
              <label>Workspace name<input v-model="title" maxlength="80" /></label
              ><label class="mt-4">Base flour name<input v-model="flour" maxlength="32" /></label>
              <div class="mt-4 grid grid-cols-2 gap-3">
                <label
                  >Dough grams<input
                    v-model="target"
                    type="number"
                    min="100"
                    max="5000"
                    step="1" /></label
                ><label
                  >Portions<input v-model="portions" type="number" min="1" max="24" step="1"
                /></label>
              </div>
              <p role="alert" class="mt-3 min-h-14 text-xs leading-relaxed text-danger">
                {{ error }}
              </p>
              <button
                class="mt-2 w-full border-accent! bg-accent text-on-accent hover:brightness-110"
              >
                Apply batch settings
              </button>
            </form>
            <div>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h3 class="font-semibold">Beyond the base flour</h3>
                <span class="font-mono text-xs text-muted"
                  >{{ draft.ingredients.length }} / 10</span
                >
              </div>
              <div
                class="mt-3 h-48 overflow-auto rounded-xl border border-line"
                data-ui="ingredient-list"
              >
                <button
                  v-for="r in draft.ingredients"
                  :key="r.id"
                  @click="selected = r.id"
                  :data-row-id="r.id"
                  :aria-pressed="selected === r.id"
                  class="flex w-full justify-between! gap-3 rounded-none! border-0! border-b! border-line! text-left text-xs"
                  :class="
                    selected === r.id
                      ? 'bg-soft text-accent'
                      : 'bg-white text-muted hover:bg-background'
                  "
                >
                  <span class="min-w-0 break-words">{{ r.name }}</span
                  ><span class="shrink-0 font-mono">{{ (r.ratio / 10).toFixed(1) }}%</span>
                </button>
                <p v-if="!draft.ingredients.length" class="p-4 text-xs text-muted">
                  Only the base flour so far. Add a line to give the recipe another ingredient.
                </p>
              </div>
              <button
                @click="add"
                :disabled="draft.ingredients.length >= 10"
                class="mt-3 w-full bg-background text-xs hover:bg-soft"
              >
                Add ingredient
              </button>
            </div>
            <div class="h-72 overflow-auto border-t border-line pt-5">
              <form
                v-if="chosen"
                @submit.prevent="saveIngredient"
                novalidate
                data-ui="ingredient-form"
              >
                <label>Ingredient name<input v-model="ingredientName" maxlength="32" /></label
                ><label class="mt-3"
                  >Baker percentage<input
                    v-model="ratio"
                    inputmode="decimal"
                    maxlength="5"
                    spellcheck="false"
                /></label>
                <p role="alert" class="mt-3 min-h-10 text-xs text-danger">{{ ingredientError }}</p>
                <div class="grid grid-cols-2 gap-2">
                  <button class="bg-background text-accent hover:bg-soft">Apply ingredient</button
                  ><button
                    type="button"
                    @click="remove = true"
                    class="bg-background text-danger hover:bg-soft"
                  >
                    Remove ingredient
                  </button>
                </div>
              </form>
              <p v-else class="text-xs leading-relaxed text-muted">
                The base flour stays at 100%. Extra ingredient lines may be empty, and a saved 0%
                line receives no dough mass.
              </p>
            </div>
            <p class="text-xs leading-relaxed text-muted">
              Current ratio total: {{ (scaled.totalRatio / 10).toFixed(1) }}%. These are direct
              ingredient ratios. A prepared ingredient such as a starter remains one line; its
              internal flour and water are not decomposed.
            </p>
          </div>
        </section>
        <section
          class="flex h-[1130px] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          data-ui="preview-panel"
        >
          <div class="border-b border-line p-5">
            <h2 class="text-lg font-semibold">A batch that balances</h2>
            <p class="mt-1 text-xs text-muted">
              Whole-gram weights · exact target · ordered rounding ties
            </p>
          </div>
          <div class="min-h-0 flex-1 overflow-auto p-5"><RecipeSummary :workspace="draft" /></div>
          <div class="grid grid-cols-2 gap-2 border-t border-line p-4">
            <button @click="exportCsv" class="bg-background text-xs hover:bg-soft">
              Ingredients CSV</button
            ><button @click="exportText" class="bg-background text-xs hover:bg-soft">
              Batch TXT
            </button>
          </div>
        </section>
      </div>
      <footer
        class="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted"
      >
        <span>Made with Vue · Stored on this device</span><span>CodeSculptor · MIT · 2026</span>
      </footer>
    </main>
    <AppDialog v-model="remove" title="Remove this ingredient?"
      ><p class="leading-relaxed text-muted">
        This removes its ratio and redistributes the target dough mass across the remaining recipe.
      </p>
      <div class="mt-6 flex justify-end gap-2">
        <button @click="remove = false" class="hover:bg-soft">Cancel</button
        ><button
          @click="deleteIngredient"
          class="border-accent! bg-accent text-on-accent hover:brightness-110"
        >
          Remove ingredient
        </button>
      </div></AppDialog
    ><AppDialog v-model="about" title="About Baker Ratio Desk"
      ><div class="space-y-4 leading-relaxed text-muted">
        <p>
          A flour-based ratio notebook with exact whole-gram largest-remainder allocation. A Vue
          composable accepts refs and getters; the summary uses a getter of compiler-reactive
          destructured props so complete imports stay current.
        </p>
        <p>
          JSON keeps the editable workspace. Local storage stays on this browser; exports let you
          keep a copy elsewhere.
        </p>
        <a href="/sample-workspace.json" class="font-semibold text-accent underline" download
          >Download the complete sample</a
        >
      </div></AppDialog
    >
  </div>
</template>
