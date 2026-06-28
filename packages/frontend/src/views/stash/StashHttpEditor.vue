<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

import type { FrontendSDK } from "@/types";

const props = withDefaults(
  defineProps<{
    heightClass?: string;
    kind: "request" | "response";
    sdk: FrontendSDK | undefined;
    value: string | undefined;
  }>(),
  {
    heightClass: "h-[32rem]",
  },
);

type RequestEditor = ReturnType<FrontendSDK["ui"]["httpRequestEditor"]>;
type ResponseEditor = ReturnType<FrontendSDK["ui"]["httpResponseEditor"]>;
type HttpEditor = RequestEditor | ResponseEditor;

const container = ref<HTMLElement>();
const editor = shallowRef<HttpEditor>();
let inputDisposers: Array<() => void> = [];

const editorValue = computed(() => {
  return props.value ?? "";
});

watch(
  () => editorValue.value,
  (value) => {
    const activeEditor = editor.value;

    if (activeEditor === undefined) {
      return;
    }

    setEditorValue(activeEditor, value);
  },
);

watch(
  () => [props.kind, props.sdk] as const,
  () => {
    rebuildEditor();
  },
);

onMounted(() => {
  rebuildEditor();
});

onBeforeUnmount(() => {
  destroyEditor();
});

function rebuildEditor() {
  destroyEditor();

  if (props.sdk === undefined || container.value === undefined) {
    return;
  }

  const nextEditor =
    props.kind === "request" ? props.sdk.ui.httpRequestEditor() : props.sdk.ui.httpResponseEditor();

  editor.value = nextEditor;
  container.value.replaceChildren(nextEditor.getElement());

  disableEditorInput(nextEditor.getElement());
  setEditorValue(nextEditor, editorValue.value);
}

function destroyEditor() {
  disposeInputHandlers();

  const activeEditor = editor.value;

  if (activeEditor !== undefined) {
    activeEditor.getEditorView().destroy();
    editor.value = undefined;
  }

  container.value?.replaceChildren();
}

function disableEditorInput(element: HTMLElement) {
  element.setAttribute("aria-readonly", "true");

  const preventInput = (event: Event) => {
    event.preventDefault();
  };

  const preventMutatingKey = (event: KeyboardEvent) => {
    if (!isMutatingKey(event)) {
      return;
    }

    event.preventDefault();
  };

  element.addEventListener("beforeinput", preventInput, { capture: true });
  element.addEventListener("cut", preventInput, { capture: true });
  element.addEventListener("drop", preventInput, { capture: true });
  element.addEventListener("paste", preventInput, { capture: true });
  element.addEventListener("keydown", preventMutatingKey, { capture: true });

  inputDisposers = [
    () => element.removeEventListener("beforeinput", preventInput, { capture: true }),
    () => element.removeEventListener("cut", preventInput, { capture: true }),
    () => element.removeEventListener("drop", preventInput, { capture: true }),
    () => element.removeEventListener("paste", preventInput, { capture: true }),
    () => element.removeEventListener("keydown", preventMutatingKey, { capture: true }),
  ];
}

function disposeInputHandlers() {
  inputDisposers.forEach((dispose) => dispose());
  inputDisposers = [];
}

function isMutatingKey(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return false;
  }

  if (event.key.length === 1) {
    return true;
  }

  return ["Backspace", "Delete", "Enter", "Tab"].includes(event.key);
}

function setEditorValue(activeEditor: HttpEditor, value: string) {
  const view = activeEditor.getEditorView();
  const currentValue = view.state.doc.toString();

  if (currentValue === value) {
    return;
  }

  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: value,
    },
  });
}
</script>

<template>
  <div
    v-if="sdk === undefined"
    class="rounded-md border border-surface-700 bg-surface-800 p-3 text-sm text-surface-400"
  >
    Caido SDK is not available.
  </div>

  <section
    v-else
    :class="[
      'stash-http-editor-shell min-w-0 overflow-hidden rounded-md border border-surface-700 bg-surface-900',
      heightClass,
    ]"
  >
    <div ref="container" class="h-full min-h-0 min-w-0" />
  </section>
</template>

<style scoped>
.stash-http-editor-shell :deep(.cm-editor) {
  height: 100%;
  background: transparent;
}

.stash-http-editor-shell :deep(.cm-scroller) {
  overflow: auto;
}

.stash-http-editor-shell :deep(.cm-gutters) {
  border-color: var(--p-surface-700);
}
</style>
