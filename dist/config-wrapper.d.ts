import { ConfigBasedMapper, createDefaultMapper, createConfigMapper, getConfigMapper } from './config';
import type { MapperConfig, ConnectionConfig, DatabaseConnectionConfig, ApiConnectionConfig } from './config';
export { ConfigBasedMapper, createDefaultMapper, createConfigMapper, getConfigMapper };
export type { MapperConfig, ConnectionConfig, DatabaseConnectionConfig, ApiConnectionConfig };
export declare const mapper: ConfigBasedMapper;
export default mapper;
