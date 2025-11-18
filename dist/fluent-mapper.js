import { createMapper } from './mapper.js';
export class FluentQueryBuilder {
    constructor(mapper, schemaName) {
        this.mapper = mapper;
        this.schemaName = schemaName;
        this.query = mapper.use(schemaName);
    }
    where(field, value, operator) {
        this.query.where(field, value, operator);
        return this;
    }
    whereComplex(raw) {
        this.query.whereComplex(raw);
        return this;
    }
    to(update) {
        this.query.to(update);
        return this;
    }
    async get() {
        return this.query.get();
    }
    async getOne() {
        return this.query.getOne();
    }
    async add(data) {
        return this.mapper.add(this.schemaName, data);
    }
    async update() {
        return this.query.update();
    }
    async delete() {
        return this.query.delete();
    }
    async deleteOne() {
        return this.query.deleteOne();
    }
    async updateOne() {
        return this.query.updateOne();
    }
}
export class FluentConnectionBuilder {
    constructor(mapper, connectionName, connectionType, config) {
        this.mapper = mapper;
        this.connectionName = connectionName;
        this.connectionType = connectionType;
        this.connectionConfig = config;
        // Create the connection immediately
        this.mapper.connect(connectionName, connectionType, config);
    }
    schema(schemaName) {
        return new FluentSchemaBuilder(this.mapper, schemaName, this.connectionName);
    }
    query(schemaName) {
        return new FluentQueryBuilder(this.mapper, schemaName);
    }
    useConnection(connectionName) {
        return new FluentConnectionSelector(this.mapper, connectionName);
    }
}
export class FluentSchemaBuilder {
    constructor(mapper, schemaName, connectionName) {
        this.mapper = mapper;
        this.schemaName = schemaName;
        this.connectionName = connectionName;
    }
    collection(collectionName) {
        return new FluentSchemaCollectionBuilder(this.mapper, this.schemaName, this.connectionName, collectionName);
    }
}
export class FluentSchemaCollectionBuilder {
    constructor(mapper, schemaName, connectionName, collectionName) {
        this.mapper = mapper;
        this.schemaName = schemaName;
        this.connectionName = connectionName;
        this.collectionName = collectionName;
    }
    structure(structure) {
        this.mapper.schema(this.schemaName)
            .use({ connection: this.connectionName, collection: this.collectionName })
            .setStructure(structure);
        return new FluentMapper(this.mapper);
    }
}
export class FluentConnectionSelector {
    constructor(mapper, connectionName) {
        this.mapper = mapper;
        this.connectionName = connectionName;
    }
    schema(schemaName) {
        return new FluentSchemaBuilder(this.mapper, schemaName, this.connectionName);
    }
    query(schemaName) {
        return new FluentQueryBuilder(this.mapper, schemaName);
    }
}
export class FluentMapper {
    constructor(mapper) {
        this.mapper = mapper;
    }
    query(schemaName) {
        return new FluentQueryBuilder(this.mapper, schemaName);
    }
    makeConnection(name, type, config) {
        return new FluentConnectionBuilder(this.mapper, name, type, config);
    }
    useConnection(connectionName) {
        return new FluentConnectionSelector(this.mapper, connectionName);
    }
    makeTempConnection(type, config) {
        const tempName = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return new FluentConnectionBuilder(this.mapper, tempName, type, config);
    }
    // Direct query methods for quick usage
    async get(schemaName, filters) {
        return this.mapper.get(schemaName, filters);
    }
    async getOne(schemaName, filters) {
        return this.mapper.getOne(schemaName, filters);
    }
    async add(schemaName, data) {
        return this.mapper.add(schemaName, data);
    }
    async update(schemaName, filters, data) {
        return this.mapper.update(schemaName, filters, data);
    }
    async delete(schemaName, filters) {
        return this.mapper.delete(schemaName, filters);
    }
}
// Static API class that provides the fluent interface
export class StaticMapper {
    static getFluentMapper() {
        if (!StaticMapper.instance) {
            const baseMapper = createMapper();
            StaticMapper.instance = new FluentMapper(baseMapper);
        }
        return StaticMapper.instance;
    }
    static makeConnection(name, type, config) {
        return StaticMapper.getFluentMapper().makeConnection(name, type, config);
    }
    static useConnection(connectionName) {
        return StaticMapper.getFluentMapper().useConnection(connectionName);
    }
    static makeTempConnection(type, config) {
        return StaticMapper.getFluentMapper().makeTempConnection(type, config);
    }
    static query(schemaName) {
        return StaticMapper.getFluentMapper().query(schemaName);
    }
    // Direct static methods
    static async get(schemaName, filters) {
        return StaticMapper.getFluentMapper().get(schemaName, filters);
    }
    static async getOne(schemaName, filters) {
        return StaticMapper.getFluentMapper().getOne(schemaName, filters);
    }
    static async add(schemaName, data) {
        return StaticMapper.getFluentMapper().add(schemaName, data);
    }
    static async update(schemaName, filters, data) {
        return StaticMapper.getFluentMapper().update(schemaName, filters, data);
    }
    static async delete(schemaName, filters) {
        return StaticMapper.getFluentMapper().delete(schemaName, filters);
    }
}
// Export a default instance for convenience
export const Mapper = StaticMapper;
export default Mapper;
