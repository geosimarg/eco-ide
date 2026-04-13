import { EcoConfig } from "./eco_config";
import { SessionData } from "./session_data";

export interface WorkspaceConfig extends EcoConfig {
    languageOverrides: Record<string, string>;
    locale?: string;
    session?: SessionData; // Session data from workspace file
}