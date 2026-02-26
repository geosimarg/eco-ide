// Previne que uma janela de console apareça no Windows em modo release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

//! Eco IDE - Backend Rust com Tauri v2

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;
use tauri::Manager;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;

/// Representa uma entrada no sistema de arquivos (arquivo ou diretório)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    #[serde(rename = "isDirectory")]
    pub is_directory: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileEntry>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expanded: Option<bool>,
}

/// Erro customizado para operações do backend
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Erro de IO: {0}")]
    Io(#[from] std::io::Error),
    #[error("Caminho inválido: {0}")]
    InvalidPath(String),
}

// Implementação de serialização para AppError
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// Lista o conteúdo de um diretório
#[tauri::command]
fn list_directory(path: String) -> Result<Vec<FileEntry>, AppError> {
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() {
        return Err(AppError::InvalidPath(format!("Caminho não existe: {}", path)));
    }
    
    if !dir_path.is_dir() {
        return Err(AppError::InvalidPath(format!("Não é um diretório: {}", path)));
    }
    
    let mut entries: Vec<FileEntry> = Vec::new();
    
    // Listar apenas o primeiro nível
    for entry in fs::read_dir(dir_path)? {
        let entry = entry?;
        let file_name = entry.file_name().to_string_lossy().to_string();
        
        let file_path = entry.path();
        let is_dir = file_path.is_dir();
        
        entries.push(FileEntry {
            name: file_name,
            path: file_path.to_string_lossy().to_string(),
            is_directory: is_dir,
            children: if is_dir { Some(Vec::new()) } else { None },
            expanded: if is_dir { Some(false) } else { None },
        });
    }

    entries.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(entries)
}

/// Lê o conteúdo de um arquivo
#[tauri::command]
fn read_file(path: String) -> Result<String, AppError> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(AppError::InvalidPath(format!("Arquivo não existe: {}", path)));
    }
    
    if !file_path.is_file() {
        return Err(AppError::InvalidPath(format!("Não é um arquivo: {}", path)));
    }
    
    let content = fs::read_to_string(file_path)?;
    Ok(content)
}

/// Escreve conteúdo em um arquivo
#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), AppError> {
    fs::write(&path, content)?;
    Ok(())
}

/// Cria um novo arquivo
#[tauri::command]
fn create_file(path: String) -> Result<(), AppError> {
    fs::write(&path, "")?;
    Ok(())
}

/// Cria um novo diretório
#[tauri::command]
fn create_directory(path: String) -> Result<(), AppError> {
    fs::create_dir_all(&path)?;
    Ok(())
}

/// Exclui um arquivo ou diretório
#[tauri::command]
fn delete_path(path: String) -> Result<(), AppError> {
    let file_path = Path::new(&path);
    
    if file_path.is_dir() {
        fs::remove_dir_all(file_path)?;
    } else {
        fs::remove_file(file_path)?;
    }
    
    Ok(())
}

/// Renomeia um arquivo ou diretório
#[tauri::command]
fn rename_path(old_path: String, new_path: String) -> Result<(), AppError> {
    fs::rename(&old_path, &new_path)?;
    Ok(())
}

/// Copia um arquivo ou diretório para um novo destino
#[tauri::command]
fn copy_path(source: String, destination: String) -> Result<(), AppError> {
    let src_path = Path::new(&source);
    let dest_path = Path::new(&destination);
    
    if !src_path.exists() {
        return Err(AppError::InvalidPath(format!("Origem não existe: {}", source)));
    }
    
    if src_path.is_file() {
        fs::copy(src_path, dest_path)?;
    } else if src_path.is_dir() {
        copy_dir_recursive(src_path, dest_path)?;
    }
    
    Ok(())
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), AppError> {
    fs::create_dir_all(dst)?;
    
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_child = entry.path();
        let dst_child = dst.join(entry.file_name());
        
        if src_child.is_dir() {
            copy_dir_recursive(&src_child, &dst_child)?;
        } else {
            fs::copy(&src_child, &dst_child)?;
        }
    }
    
    Ok(())
}


#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub file: String,
    pub line: usize,
    pub content: String,
}

fn parse_exclude_patterns(exclude: Option<&str>) -> Vec<String> {
    let Some(s) = exclude else { return vec![] };
    s.split(|c| c == ',' || c == '\n')
        .map(|p| p.trim().to_string())
        .filter(|p| !p.is_empty())
        .collect()
}

fn relative_path(path: &Path, base: &Path) -> String {
    path.strip_prefix(base)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
        .trim_start_matches('/')
        .to_string()
}

fn path_matches_exclude(rel_path: &str, patterns: &[String]) -> bool {
    use std::path::Path as StdPath;
    let path_as_path = StdPath::new(rel_path);
    let file_name = path_as_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");

    for pattern in patterns {
        let pattern = pattern.trim();
        if pattern.is_empty() {
            continue;
        }

        let glob_pattern = if pattern.contains('*') || pattern.contains('/') {
            pattern.to_string()
        } else {
            format!("**/{}/**", pattern)
        };
        if let Ok(g) = glob::Pattern::new(&glob_pattern) {
            if g.matches(rel_path) {
                return true;
            }
        }

        let glob_simple = if pattern.contains('*') || pattern.contains('/') {
            pattern.to_string()
        } else {
            format!("**/{}", pattern)
        };
        if let Ok(g) = glob::Pattern::new(&glob_simple) {
            if g.matches(rel_path) || g.matches(file_name) {
                return true;
            }
        }
    }
    false
}

#[tauri::command]
fn search_files(
    directory: String,
    query: String,
    exclude: Option<String>,
) -> Result<Vec<SearchResult>, AppError> {
    let mut results = Vec::new();
    let query_lower = query.to_lowercase();
    let exclude_patterns = parse_exclude_patterns(exclude.as_deref());
    let directory_path = Path::new(&directory);

    for entry in WalkDir::new(&directory)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            if name.starts_with('.') || name == "node_modules" || name == "target" {
                return false;
            }
            if exclude_patterns.is_empty() {
                return true;
            }
            let rel = relative_path(e.path(), directory_path);
            !path_matches_exclude(&rel, &exclude_patterns)
        })
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            let path = entry.path();
            let rel = relative_path(path, directory_path);
            if !exclude_patterns.is_empty() && path_matches_exclude(&rel, &exclude_patterns) {
                continue;
            }
            if let Ok(content) = fs::read_to_string(path) {
                for (line_num, line) in content.lines().enumerate() {
                    if line.to_lowercase().contains(&query_lower) {
                        results.push(SearchResult {
                            file: path.to_string_lossy().to_string(),
                            line: line_num + 1,
                            content: line.trim().to_string(),
                        });
                    }
                }
            }
        }
    }

    Ok(results)
}

/// Retorna o diretório de configuração da aplicação
#[tauri::command]
fn get_app_config_dir(app_handle: tauri::AppHandle) -> Result<String, AppError> {
    let config_dir = app_handle.path().app_config_dir().map_err(|_| {
        AppError::InvalidPath("Não foi possível determinar o diretório de configuração do app".to_string())
    })?;
    
    // Garantir que o diretório existe
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)?;
    }
    
    Ok(config_dir.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Mostrar Eco IDE", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(true)
                .icon(app.default_window_icon().unwrap().clone())
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_directory,
            read_file,
            write_file,
            create_file,
            create_directory,
            delete_path,
            rename_path,
            copy_path,
            search_files,
            get_app_config_dir,
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao executar a aplicação Tauri");
}
