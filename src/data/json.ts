import { fileOpen, fileSave } from "browser-fs-access";
import { cleanAppStateForExport } from "../appState";
import { MIME_TYPES } from "../constants";
import { clearElementsForExport } from "../element";
import { ExcalidrawElement } from "../element/types";
import { AppState } from "../types";
import { loadFromBlob } from "./blob";
import { Library } from "./library";

export const serializeAsJSON = (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
): string =>
  JSON.stringify(
    {
      type: "excalidraw",
      version: 2,
      source: window.location.origin,
      elements: clearElementsForExport(elements),
      appState: cleanAppStateForExport(appState),
    },
    null,
    2,
  );

export const saveAsJSON = async (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
) => {
  const serialized = serializeAsJSON(elements, appState);
  const blob = new Blob([serialized], {
    type: "application/json",
  });

  const fileHandle = await fileSave(
    blob,
    {
      fileName: appState.name,
      description: "Excalidraw file",
      extensions: [".excalidraw"],
    },
    appState.fileHandle,
  );
  return { fileHandle };
};

export const saveAsRecord = async (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
) => {
  const serialized = serializeAsJSON(elements, appState);
  const params = new URLSearchParams(window.location.search);
  const recordId = params.get('recordId');

  await new Promise((resolve, reject) => {
    (window as any).$VFRM.Manager.getController('ExcalidrawController').save(recordId, serialized, (result: any, event: any) => {
        if(event.status) {
            window.alert('Saved successfully');
            resolve(null);
        }
        else {
            reject(`Error: ${event.message}`);
        }
    }, { escape: false });
  });

  return { fileHandle: null };
};

export const loadFromJSON = async (localAppState: AppState) => {
  const blob = await fileOpen({
    description: "Excalidraw files",
    extensions: [".json", ".excalidraw", ".png", ".svg"],
    mimeTypes: ["application/json", "image/png", "image/svg+xml"],
  });
  return loadFromBlob(blob, localAppState);
};

export const isValidLibrary = (json: any) => {
  return (
    typeof json === "object" &&
    json &&
    json.type === "excalidrawlib" &&
    json.version === 1
  );
};

export const saveLibraryAsJSON = async () => {
  const library = await Library.loadLibrary();
  const serialized = JSON.stringify(
    {
      type: "excalidrawlib",
      version: 1,
      library,
    },
    null,
    2,
  );
  const fileName = "library.excalidrawlib";
  const blob = new Blob([serialized], {
    type: MIME_TYPES.excalidrawlib,
  });
  await fileSave(blob, {
    fileName,
    description: "Excalidraw library file",
    extensions: [".excalidrawlib"],
  });
};

export const importLibraryFromJSON = async () => {
  const blob = await fileOpen({
    description: "Excalidraw library files",
    extensions: [".json", ".excalidrawlib"],
    mimeTypes: ["application/json"],
  });
  Library.importLibrary(blob);
};
