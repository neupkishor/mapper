import { Connections, SchemaManager, type SchemaDef } from './index.js';
import { createMapper } from './mapper.js';

export class FluentQueryBuilder {
  private mapper: any;
  private schemaName: string;
  private query: any;

  constructor(mapper: any, schemaName: string) {
    this.mapper = mapper;
    this.schemaName = schemaName;
    this.query = mapper.use(schemaName);
  }

  where(field: string, value: any, operator?: string): this {
    this.query.where(field, value, operator);
    return this;
  }

  whereComplex(raw: string): this {
    this.query.whereComplex(raw);
    return this;
  }

  to(update: Record<string, any>): this {
    this.query.to(update);
    return this;
  }

  async get(): Promise<Record<string, any>[]> {
    return this.query.get();
  }

  async getOne(): Promise<Record<string, any> | null> {
    return this.query.getOne();
  }

  async add(data: Record<string, any>): Promise<any> {
    return this.mapper.add(this.schemaName, data);
  }

  async update(): Promise<void> {
    return this.query.update();
  }

  async delete(): Promise<void> {
    return this.query.delete();
  }

  async deleteOne(): Promise<void> {
    return this.query.deleteOne();
  }

  async updateOne(): Promise<void> {
    return this.query.updateOne();
  }
}

export class FluentConnectionBuilder {
  private mapper: any;
  private connectionName: string;
  private connectionType: string;
  private connectionConfig: Record<string, any>;

  constructor(mapper: any, connectionName: string, connectionType: string, config: Record<string, any>) {
    this.mapper = mapper;
    this.connectionName = connectionName;
    this.connectionType = connectionType;
    this.connectionConfig = config;
    
    // Create the connection immediately
    this.mapper.connect(connectionName, connectionType, config);
  }

  schema(schemaName: string): FluentSchemaBuilder {
    return new FluentSchemaBuilder(this.mapper, schemaName, this.connectionName);
  }

  query(schemaName: string): FluentQueryBuilder {
    return new FluentQueryBuilder(this.mapper, schemaName);
  }

  useConnection(connectionName: string): FluentConnectionSelector {
    return new FluentConnectionSelector(this.mapper, connectionName);
  }
}

export class FluentSchemaBuilder {
  private mapper: any;
  private schemaName: string;
  private connectionName: string;

  constructor(mapper: any, schemaName: string, connectionName: string) {
    this.mapper = mapper;
    this.schemaName = schemaName;
    this.connectionName = connectionName;
  }

  collection(collectionName: string): FluentSchemaCollectionBuilder {
    return new FluentSchemaCollectionBuilder(this.mapper, this.schemaName, this.connectionName, collectionName);
  }
}

export class FluentSchemaCollectionBuilder {
  private mapper: any;
  private schemaName: string;
  private connectionName: string;
  private collectionName: string;

  constructor(mapper: any, schemaName: string, connectionName: string, collectionName: string) {
    this.mapper = mapper;
    this.schemaName = schemaName;
    this.connectionName = connectionName;
    this.collectionName = collectionName;
  }

  structure(structure: Record<string, string> | Array<{ name: string; type: string; [key: string]: any }>): FluentMapper {
    this.mapper.schema(this.schemaName)
      .use({ connection: this.connectionName, collection: this.collectionName })
      .setStructure(structure);
    
    return new FluentMapper(this.mapper);
  }
}

export class FluentConnectionSelector {
  private mapper: any;
  private connectionName: string;

  constructor(mapper: any, connectionName: string) {
    this.mapper = mapper;
    this.connectionName = connectionName;
  }

  schema(schemaName: string): FluentSchemaBuilder {
    return new FluentSchemaBuilder(this.mapper, schemaName, this.connectionName);
  }

  query(schemaName: string): FluentQueryBuilder {
    return new FluentQueryBuilder(this.mapper, schemaName);
  }
}

export class FluentMapper {
  private mapper: any;

  constructor(mapper: any) {
    this.mapper = mapper;
  }

  query(schemaName: string): FluentQueryBuilder {
    return new FluentQueryBuilder(this.mapper, schemaName);
  }

  makeConnection(name: string, type: 'mysql' | 'sql' | 'firestore' | 'mongodb' | 'api', config: Record<string, any>): FluentConnectionBuilder {
    return new FluentConnectionBuilder(this.mapper, name, type, config);
  }

  useConnection(connectionName: string): FluentConnectionSelector {
    return new FluentConnectionSelector(this.mapper, connectionName);
  }

  makeTempConnection(type: 'mysql' | 'sql' | 'firestore' | 'mongodb' | 'api', config: Record<string, any>): FluentConnectionBuilder {
    const tempName = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new FluentConnectionBuilder(this.mapper, tempName, type, config);
  }

  // Direct query methods for quick usage
  async get(schemaName: string, filters?: Record<string, any>): Promise<Record<string, any>[]> {
    return this.mapper.get(schemaName, filters);
  }

  async getOne(schemaName: string, filters?: Record<string, any>): Promise<Record<string, any> | null> {
    return this.mapper.getOne(schemaName, filters);
  }

  async add(schemaName: string, data: Record<string, any>): Promise<any> {
    return this.mapper.add(schemaName, data);
  }

  async update(schemaName: string, filters: Record<string, any>, data: Record<string, any>): Promise<void> {
    return this.mapper.update(schemaName, filters, data);
  }

  async delete(schemaName: string, filters: Record<string, any>): Promise<void> {
    return this.mapper.delete(schemaName, filters);
  }
}

// Static API class that provides the fluent interface
export class StaticMapper {
  private static instance: FluentMapper;

  private static getFluentMapper(): FluentMapper {
    if (!StaticMapper.instance) {
      const baseMapper = createMapper();
      StaticMapper.instance = new FluentMapper(baseMapper);
    }
    return StaticMapper.instance;
  }

  static makeConnection(name: string, type: 'mysql' | 'sql' | 'firestore' | 'mongodb' | 'api', config: Record<string, any>): FluentConnectionBuilder {
    return StaticMapper.getFluentMapper().makeConnection(name, type, config);
  }

  static useConnection(connectionName: string): FluentConnectionSelector {
    return StaticMapper.getFluentMapper().useConnection(connectionName);
  }

  static makeTempConnection(type: 'mysql' | 'sql' | 'firestore' | 'mongodb' | 'api', config: Record<string, any>): FluentConnectionBuilder {
    return StaticMapper.getFluentMapper().makeTempConnection(type, config);
  }

  static query(schemaName: string): FluentQueryBuilder {
    return StaticMapper.getFluentMapper().query(schemaName);
  }

  // Direct static methods
  static async get(schemaName: string, filters?: Record<string, any>): Promise<Record<string, any>[]> {
    return StaticMapper.getFluentMapper().get(schemaName, filters);
  }

  static async getOne(schemaName: string, filters?: Record<string, any>): Promise<Record<string, any> | null> {
    return StaticMapper.getFluentMapper().getOne(schemaName, filters);
  }

  static async add(schemaName: string, data: Record<string, any>): Promise<any> {
    return StaticMapper.getFluentMapper().add(schemaName, data);
  }

  static async update(schemaName: string, filters: Record<string, any>, data: Record<string, any>): Promise<void> {
    return StaticMapper.getFluentMapper().update(schemaName, filters, data);
  }

  static async delete(schemaName: string, filters: Record<string, any>): Promise<void> {
    return StaticMapper.getFluentMapper().delete(schemaName, filters);
  }
}

// Export a default instance for convenience
export const Mapper = StaticMapper;
export default Mapper;