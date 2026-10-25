<script setup lang="ts">
import type { Workspace } from '../domain/recipe.ts'
import { useRecipeScale } from '../composables/useRecipeScale.ts'
const { workspace } = defineProps<{ workspace: Workspace }>(),
  result = useRecipeScale(() => workspace)
</script>
<template>
  <div class="space-y-5" data-ui="recipe-summary">
    <div class="grid grid-cols-3 gap-2">
      <div class="h-28 rounded-xl border border-line p-3">
        <p class="text-[10px] uppercase text-muted">Dough grams</p>
        <p class="mt-2 font-mono text-xl" data-ui="dough-total">
          {{ result.allocations.reduce((n, r) => n + r.grams, 0) }}
        </p>
      </div>
      <div class="h-28 rounded-xl border border-line p-3">
        <p class="text-[10px] uppercase text-muted">Recipe %</p>
        <p class="mt-2 font-mono text-lg" data-ui="ratio-total">
          {{ (result.totalRatio / 10).toFixed(1) }}
        </p>
      </div>
      <div class="h-28 rounded-xl border border-line p-3">
        <p class="text-[10px] uppercase text-muted">Portions</p>
        <p class="mt-2 font-mono text-xl">{{ result.portions.length }}</p>
      </div>
    </div>
    <div>
      <h3 class="font-semibold">The weighing sheet</h3>
      <ul
        class="mt-3 h-80 space-y-3 overflow-auto rounded-xl border border-line p-3"
        data-ui="allocation-list"
      >
        <li
          v-for="row in result.allocations"
          :key="row.id"
          :data-ingredient="row.id"
          class="rounded-lg border border-line bg-background p-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="min-w-0 break-words text-sm font-semibold">{{ row.name }}</span
            ><span class="font-mono text-sm text-accent" :data-grams="row.id"
              >{{ row.grams }} g</span
            >
          </div>
          <div class="mt-3 h-2 overflow-hidden rounded-full bg-accent/10">
            <div
              class="h-full rounded-full bg-accent"
              :style="{ width: (row.grams / workspace.target) * 100 + '%' }"
            ></div>
          </div>
          <p class="mt-2 text-xs text-muted">{{ (row.ratio / 10).toFixed(1) }}% of base flour</p>
        </li>
      </ul>
    </div>
    <div>
      <h3 class="font-semibold">Divide the finished dough</h3>
      <ol
        class="mt-3 flex h-36 flex-wrap content-start gap-2 overflow-auto rounded-xl border border-line p-3"
        data-ui="portion-list"
      >
        <li
          v-for="(grams, i) in result.portions"
          :key="i"
          class="rounded-lg border border-line bg-soft px-3 py-2 font-mono text-xs"
        >
          {{ i + 1 }} · {{ grams }} g
        </li>
      </ol>
      <p class="mt-3 text-xs leading-relaxed text-muted">
        Earlier portions receive the spare grams. The portion weights add up to the same dough
        target.
      </p>
    </div>
    <div class="rounded-xl border border-line bg-soft p-4">
      <h3 class="font-semibold">A percentage has a base</h3>
      <p class="mt-2 text-xs leading-relaxed text-muted">
        The base flour is always 100%. Other percentages compare with that flour amount, rather than
        with the whole dough. Rounding uses the largest fractional remainders so the ingredient
        weights still add up exactly.
      </p>
    </div>
  </div>
</template>
