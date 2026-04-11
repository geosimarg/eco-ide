pub mod host;

use std::sync::Mutex;
use tauri::State;
use host::ExtensionHost;

pub struct ExtensionState(pub Mutex<ExtensionHost>);

#[tauri::command]
pub async fn load_extension(
    state: State<'_, ExtensionState>,
    path: String,
) -> Result<(), String> {
    let mut host = state.0.lock().unwrap();
    host.load_extension(&path).map_err(|e| e.to_string())
}
