import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { scale, type Workspace } from '../domain/recipe.ts'
export function useRecipeScale(workspace: MaybeRefOrGetter<Workspace>) {
  return computed(() => scale(toValue(workspace)))
}
