import {
  render,
  waitFor,
  screen,
  cleanup,
  fireEvent,
} from "@testing-library/svelte";
import Splash from "./Splash.svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockIPC } from "@tauri-apps/api/mocks";
import { folderPrompt } from "$lib/utils/file-dialogs";

vi.mock("$lib/utils/file-dialogs");

describe("Splash.svelte", () => {
  // TODO: @testing-library/svelte claims to add this automatically but it doesn't work without explicit afterEach
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should render the splash", async () => {
    mockIPC((cmd, args) => {
      console.log(`Unhandled Tauri IPC: ${cmd}`);
    });
    render(Splash, {});
    await waitFor(() => {
      expect(screen.getByTestId("splash-logo")).toBeTruthy();
    });
  });

  it("should display the locale dropdown", async () => {
    // TODO - generalize into function
    mockIPC((cmd, args) => {
      if (cmd === "get_setting_value" && args.key === "locale") {
        return null;
      } else {
        console.log(`Unhandled Tauri IPC: ${cmd}`);
      }
    });
    render(Splash, {});
    const localeSelect = await screen.findByTestId("locale-select");
    expect(localeSelect).toBeTruthy();
  });

  it("should set the locale when selected", async () => {
    // TODO - generalize into function
    mockIPC((cmd, args) => {
      if (cmd === "get_setting_value" && args.key === "locale") {
        return null;
      }
      if (cmd === "update_setting_value" && args.key === "locale") {
        return;
      } else {
        console.log(`Unhandled Tauri IPC: ${cmd}`);
      }
    });
    render(Splash, {});
    const localeSelect = (await screen.findByTestId(
      "locale-select",
    )) as HTMLSelectElement;
    expect(localeSelect).toBeTruthy();
    fireEvent.change(localeSelect, { target: { value: "en-US" } });
    expect(localeSelect.value).toBe("en-US");
  });

  it("should prompt user to select installation directory - cancelled dialog", async () => {
    // TODO - generalize into function
    // return an object that tracks mock calls / args
    mockIPC((cmd, args) => {
      if (cmd === "get_setting_value" && args.key === "locale") {
        return "en-US";
      } else if (
        cmd === "get_setting_value" &&
        args.key === "install_directory"
      ) {
        return null;
      } else if (cmd === "has_old_data_directory") {
        return false;
      } else {
        console.log(`Unhandled Tauri IPC: ${cmd}`);
      }
    });
    vi.mocked(folderPrompt).mockResolvedValue(undefined);
    render(Splash, {});
    let pickInstallFolderButton = await screen.findByTestId(
      "pick-install-folder-button",
    );
    expect(pickInstallFolderButton).toBeTruthy();
    fireEvent.click(pickInstallFolderButton);
    // It's still there since the user didn't pick a folder
    pickInstallFolderButton = await screen.findByTestId(
      "pick-install-folder-button",
    );
    expect(pickInstallFolderButton).toBeTruthy();
  });

  it("should prompt user to select installation directory - successful dialog", async () => {
    // TODO - generalize into function
    // return an object that tracks mock calls / args
    let setInstallDirectorySet = false;
    let mainWindowOpened = false;
    mockIPC((cmd, args) => {
      if (cmd === "get_setting_value" && args.key === "locale") {
        return "en-US";
      } else if (
        cmd === "get_setting_value" &&
        args.key === "install_directory"
      ) {
        return null;
      } else if (cmd === "has_old_data_directory") {
        return false;
      } else if (cmd === "set_install_directory") {
        setInstallDirectorySet = true;
        return null;
      } else if (cmd === "open_main_window") {
        mainWindowOpened = true;
        return;
      } else {
        console.log(`Unhandled Tauri IPC: ${cmd}`);
      }
    });
    vi.mocked(folderPrompt).mockResolvedValue("/wow/good/job/nice/folder");
    render(Splash, {});
    await waitFor(async () => {
      let pickInstallFolderButton = await screen.findByTestId(
        "pick-install-folder-button",
      );
      expect(pickInstallFolderButton).toBeTruthy();
      fireEvent.click(pickInstallFolderButton);
    });
    await waitFor(() => {
      expect(setInstallDirectorySet).toBeTruthy();
    });
    await waitFor(
      () => {
        expect(mainWindowOpened).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it("should prompt user to select installation directory - bad directory choosen", async () => {
    // TODO - generalize into function
    // return an object that tracks mock calls / args
    let mainWindowOpened = false;
    mockIPC((cmd, args) => {
      if (cmd === "get_setting_value" && args.key === "locale") {
        return "en-US";
      } else if (
        cmd === "get_setting_value" &&
        args.key === "install_directory"
      ) {
        return null;
      } else if (cmd === "has_old_data_directory") {
        return false;
      } else if (cmd === "set_install_directory") {
        return "wow that was a terrible directory";
      } else if (cmd === "open_main_window") {
        mainWindowOpened = true;
        return;
      } else {
        console.log(`Unhandled Tauri IPC: ${cmd}`);
      }
    });
    vi.mocked(folderPrompt).mockResolvedValue("/wow/good/job/nice/folder");
    render(Splash, {});
    await waitFor(async () => {
      let pickInstallFolderButton = await screen.findByTestId(
        "pick-install-folder-button",
      );
      expect(pickInstallFolderButton).toBeTruthy();
      fireEvent.click(pickInstallFolderButton);
    });
    await waitFor(() => {
      screen.findByText("wow that was a terrible directory");
    });
    let pickInstallFolderButton = await screen.findByTestId(
      "pick-install-folder-button",
    );
    expect(pickInstallFolderButton).toBeTruthy();
  });
});
