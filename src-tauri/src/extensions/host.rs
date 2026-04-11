use anyhow::Result;
use wasmtime::*;
// use wasmtime_wasi::{WasiCtx, WasiCtxBuilder};

pub struct ExtensionHost {
    _engine: Engine,
}

impl ExtensionHost {
    pub fn new() -> Result<Self> {
        let mut config = Config::new();
        // Habilita otimizações do cranelift
        config.cranelift_opt_level(OptLevel::Speed);
        
        let engine = Engine::new(&config)?;
        
        Ok(Self { engine })
    }

    pub fn load_extension(&mut self, _path: &str) -> Result<()> {
        /*
        let module = Module::from_file(&self.engine, path)?;
        let mut linker: Linker<WasiCtx> = Linker::new(&self.engine);
        wasmtime_wasi::add_to_linker(&mut linker, |s| s)?;

        let wasi = WasiCtxBuilder::new()
            .inherit_stdio()
            .build();
            
        let mut store = Store::new(&self.engine, wasi);
        
        let instance = linker.instantiate(&mut store, &module)?;
        
        // Aqui buscaríamos funções exportadas, como `activate()`
        */
        Ok(())
    }
}
