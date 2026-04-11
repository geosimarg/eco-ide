pub mod host;

use std::path::Path;
use std::sync::Mutex;
use tauri::State;
use host::ExtensionHost;
use serde::{Deserialize, Serialize};

pub struct ExtensionState(pub Mutex<ExtensionHost>);

/// Manifesto de extensão (eco-ext.json)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionManifest {
    pub name: String,
    pub version: String,
    pub author: Option<String>,
    pub description: Option<String>,
    pub languages: Option<Vec<String>>,
}

/// Informação de uma extensão carregada
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoadedExtension {
    pub name: String,
    pub version: String,
    pub author: Option<String>,
    pub description: Option<String>,
    pub path: String,
}

/// Carrega e parsea o manifesto de uma extensão
fn load_manifest(extension_dir: &Path) -> Option<ExtensionManifest> {
    let manifest_path = extension_dir.join("eco-ext.json");
    if !manifest_path.exists() {
        return None;
    }
    
    let content = std::fs::read_to_string(&manifest_path).ok()?;
    serde_json::from_str(&content).ok()
}

/// Escaneia um diretório e descobre extensões
fn discover_extensions_in_dir(dir: &Path) -> Vec<LoadedExtension> {
    let mut extensions = Vec::new();
    
    if !dir.exists() || !dir.is_dir() {
        return extensions;
    }
    
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                // Verifica se há .wasm no diretório
                let wasm_files: Vec<_> = std::fs::read_dir(&path)
                    .ok()
                    .into_iter()
                    .flat_map(|entries| entries.filter_map(|e| e.ok()))
                    .filter(|e| e.path().extension().map_or(false, |ext| ext == "wasm"))
                    .collect();
                
                if !wasm_files.is_empty() {
                    let manifest = load_manifest(&path);
                    let m_ref = manifest.as_ref();
                    let ext = LoadedExtension {
                        name: m_ref.map_or("unknown", |m| m.name.as_str()).to_string(),
                        version: m_ref.map_or("0.0.0", |m| m.version.as_str()).to_string(),
                        author: m_ref.and_then(|m| m.author.clone()),
                        description: m_ref.and_then(|m| m.description.clone()),
                        path: path.to_string_lossy().to_string(),
                    };
                    extensions.push(ext);
                }
            }
        }
    }
    
    extensions
}

#[tauri::command]
pub async fn load_extension(
    state: State<'_, ExtensionState>,
    path: String,
) -> Result<(), String> {
    let mut host = state.0.lock().unwrap();
    host.load_extension(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn discover_extensions(
    state: State<'_, ExtensionState>,
    workspace_path: String,
) -> Result<Vec<LoadedExtension>, String> {
    let extensions_dir = Path::new(&workspace_path).join(".eco/extensions");
    let extensions = discover_extensions_in_dir(&extensions_dir);
    
    // Carregar cada extensão encontrada
    let mut host = state.0.lock().unwrap();
    for ext in &extensions {
        let wasm_path = Path::new(&ext.path);
        if let Ok(entries) = std::fs::read_dir(wasm_path) {
            for entry in entries.filter_map(|e| e.ok()) {
                let path = entry.path();
                if path.extension().map_or(false, |ext| ext == "wasm") {
                    let _ = host.load_extension(&path.to_string_lossy());
                }
            }
        }
    }
    
    Ok(extensions)
}

#[tauri::command]
pub async fn list_extensions(
    _state: State<'_, ExtensionState>,
) -> Result<Vec<String>, String> {
    // Retorna lista vazia - implementado via discover_extensions
    Ok(Vec::new())
}
