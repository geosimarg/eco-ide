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

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub file: String,
    pub line: usize,
    pub content: String,
}

/// Busca texto em arquivos de um diretório
#[tauri::command]
fn search_files(
    directory: String,
    query: String,
) -> Result<Vec<SearchResult>, AppError> {
    let mut results = Vec::new();
    let query_lower = query.to_lowercase();
    
    for entry in WalkDir::new(&directory)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !name.starts_with('.') && name != "node_modules" && name != "target"
        })
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            // Limitar a arquivos de texto
            let path = entry.path();
            if let Some(ext) = path.extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                let text_extensions = ["rs", "ts", "js", "vue", "json", "md", "toml", "yaml", "yml", "html", "css", "py"];
                
                if text_extensions.contains(&ext_str.as_str()) {
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
        .invoke_handler(tauri::generate_handler![
            list_directory,
            read_file,
            write_file,
            create_file,
            create_directory,
            delete_path,
            rename_path,
            search_files,
            get_app_config_dir,
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao executar a aplicação Tauri");
}
