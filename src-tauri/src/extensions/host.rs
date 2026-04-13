#[allow(dead_code)]
pub struct ExtensionHost;

impl ExtensionHost {
    pub fn new() -> Self {
        Self
    }

    pub fn load_extension(&mut self, _path: &str) -> Result<(), String> {
        Ok(())
    }
}
