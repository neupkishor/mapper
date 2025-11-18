import { ConfigBasedMapper, createDefaultMapper, createConfigMapper, getConfigMapper } from './config';
// Re-export the config-based system as the primary interface
export { ConfigBasedMapper, createDefaultMapper, createConfigMapper, getConfigMapper };
// Create and export a default configured mapper instance
export const mapper = createDefaultMapper();
// Export the config-based mapper as the default export
export default mapper;
