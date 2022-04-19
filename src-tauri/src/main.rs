#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri_plugin_store::PluginBuilder;

mod commands;
use commands::{get_highest_simd};

fn main() {
  tauri::Builder::default()
    .plugin(PluginBuilder::default().build())
    .invoke_handler(tauri::generate_handler![
      get_highest_simd,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}