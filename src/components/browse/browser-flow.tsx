'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Play, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Connection } from '@/lib/orm/query-builder';
import { listConnections, getRuntimeDbConfig } from '@/app/actions';
import { getCookie, SCHEMA_COOKIE_KEY } from '@/lib/client-cookies';

type DbType = 'Firestore' | 'SQL' | 'MongoDB' | 'API';
type Operation = 'get' | 'getOne' | 'update' | 'updateOne' | 'delete' | 'deleteOne' | 'add';

type WhereClause = { field: string; operator: '==' | '<' | '>' | '<=' | '>=' | '!='; value: string };
type SortBy = { field: string; direction: 'asc' | 'desc' };

export function BrowserFlow() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<string[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | 'undefined' | null>(null);
  const [selectedDbType, setSelectedDbType] = useState<DbType | null>(null);
  const [schemaNames, setSchemaNames] = useState<string[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string | 'undefined' | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [fields, setFields] = useState('');
  const [whereClauses, setWhereClauses] = useState<WhereClause[]>([]);
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [offset, setOffset] = useState<number | null>(null);
  const [docId, setDocId] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  // Manual DB type and API base path when undefined is used
  const [manualDbType, setManualDbType] = useState<DbType | null>(null);
  // API base URL for concrete connections (read-only display)
  const [selectedApiBasePath, setSelectedApiBasePath] = useState<string | null>(null);
  // Add JSON for add/addOne operations
  const [addJson, setAddJson] = useState('');
  // Per-connection schema map to load structure
  const [schemaMap, setSchemaMap] = useState<Record<string, any>>({});
  // Global schema list and mapping to associated connections
  const [schemaToConnection, setSchemaToConnection] = useState<Record<string, string>>({});
  // API-specific controls
  const [apiQueryParams, setApiQueryParams] = useState<{ key: string; value: string }[]>([]);
  const [apiBodyType, setApiBodyType] = useState<'json' | 'form' | 'urlencoded'>('json');
const [apiUpdateMethod, setApiUpdateMethod] = useState<'PUT' | 'PATCH'>('PUT');
// Fill Parameters – section reveals and where modes
const [showWhere, setShowWhere] = useState(false);
const [showLimit, setShowLimit] = useState(false);
const [showOffset, setShowOffset] = useState(false);
const [showSort, setShowSort] = useState(false);
const [whereMode, setWhereMode] = useState<'none' | 'simple' | 'complex'>('none');
  const [whereComplexJson, setWhereComplexJson] = useState('');
  // Update fields for mutation operations (multiple)
  const [updateFields, setUpdateFields] = useState<{ field: string; value: string }[]>([]);
  const [apiEndpoint, setApiEndpoint] = useState<string>('');

  // Step 1: Load connections
  useEffect(() => {
    (async () => {
      try {
        const names = await listConnections();
        setConnections(names);
      } catch (e) {}
    })();
  }, []);

  // Load all schemas across connections on mount
  useEffect(() => {
    try {
      const saved = getCookie(SCHEMA_COOKIE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      const allSchemaNames: string[] = [];
      const toConn: Record<string, string> = {};
      const structures: Record<string, any> = {};
      Object.keys(parsed || {}).forEach((conn) => {
        const schemasObj = parsed[conn] || {};
        Object.keys(schemasObj).forEach((schemaName) => {
          allSchemaNames.push(schemaName);
          toConn[schemaName] = conn;
          structures[schemaName] = schemasObj[schemaName];
        });
      });
      setSchemaNames(allSchemaNames);
      setSchemaMap(structures);
      setSchemaToConnection(toConn);
    } catch (e) {
      setSchemaNames([]);
      setSchemaMap({});
      setSchemaToConnection({});
    }
  }, []);

  // When a connection is selected, determine db type and API base path
  useEffect(() => {
    (async () => {
      try {
        let connName: string | undefined = undefined;
        if (selectedConnection && selectedConnection !== 'undefined') connName = selectedConnection;
        // Determine db type of the effective connection (default if undefined)
        const cfg = await getRuntimeDbConfig(connName ?? 'default');
        setSelectedDbType((cfg?.dbType ?? null) as DbType | null);
        setSelectedApiBasePath(cfg?.dbType === 'API' ? (cfg?.basePath ?? null) : null);
      } catch (e) {
        setSelectedDbType(null);
      }
    })();
  }, [selectedConnection]);

  // Helpers
  const effectiveCollection = useMemo(() => {
    if (selectedSchema && selectedSchema !== 'undefined') return selectedSchema;
    return collectionName;
  }, [selectedSchema, collectionName]);
  const selectedSchemaStructure = useMemo(() => {
    if (selectedSchema && selectedSchema !== 'undefined') {
      return schemaMap[selectedSchema] ?? null;
    }
    return null;
  }, [selectedSchema, schemaMap]);

  // Prefill endpoint from selected schema if it contains apiEndpoint
  useEffect(() => {
    const ep = (selectedSchemaStructure as any)?.apiEndpoint;
    if (ep && typeof ep === 'string') setApiEndpoint(ep);
  }, [selectedSchemaStructure]);

  // Schemas to show in line 2 depending on selected connection
  const visibleSchemaNames = useMemo(() => {
    if (!selectedConnection) return [];
    if (selectedConnection === 'undefined') return [];
    return schemaNames.filter((name) => schemaToConnection[name] === selectedConnection);
  }, [selectedConnection, schemaNames, schemaToConnection]);

  // Whether the current selection implies API behavior
  const isApiSelected = useMemo(() => {
    if (selectedConnection && selectedConnection !== 'undefined') return selectedDbType === 'API';
    if (selectedConnection === 'undefined') return manualDbType === 'API';
    return false;
  }, [selectedConnection, selectedDbType, manualDbType]);

  // Only show operations after required details are provided
  const canShowOperations = useMemo(() => {
    const hasConn = !!selectedConnection;
    const hasSchema = !!selectedSchema;
    if (!hasConn && !hasSchema) return false;

    // Treat literal 'undefined' as defined per user semantics
    if (selectedSchema === 'undefined') return true;
    if (selectedConnection === 'undefined') return true;

    // If a concrete schema is selected, details are satisfied
    if (selectedSchema) return true;

    // If API is selected (explicit connection), proceed without requiring endpoint
    if (isApiSelected) {
      return true;
    }

    // Non-API explicit connection: require collection name
    return collectionName.trim().length > 0;
  }, [selectedConnection, selectedSchema, isApiSelected, collectionName]);

  const addWhereClause = () => setWhereClauses([...whereClauses, { field: '', operator: '==', value: '' }]);
  const updateWhereClause = (index: number, part: Partial<WhereClause>) => {
    const newClauses = [...whereClauses];
    newClauses[index] = { ...newClauses[index], ...part } as WhereClause;
    setWhereClauses(newClauses);
  };
  const removeWhereClause = (index: number) => {
    const next = whereClauses.filter((_, i) => i !== index);
    setWhereClauses(next);
    if (next.length === 0) {
      setWhereMode('none');
    }
  };

  // Hide results when navigating back to earlier steps
  useEffect(() => {
    if (showResults) {
      setShowResults(false);
    }
  }, [selectedConnection, selectedSchema, manualDbType, collectionName, operation]);

  // Step: Generate code based on current state
  const handleGenerateCode = () => {
    setError(null);
    setResults([]);
    setShowResults(false);
    if (!operation) {
      toast({ variant: 'destructive', title: 'Select an operation first.' });
      return;
    }
    if (!isApiSelected) {
      const collCheck = (selectedSchema && selectedSchema !== 'undefined') ? selectedSchema : collectionName;
      if (!collCheck) {
        toast({ variant: 'destructive', title: 'Provide a collection or pick a schema.' });
        return;
      }
    }
    // Endpoint prompt rules: only enforce when connection is 'undefined' and manual type is API,
    // and schema is not 'undefined'. If schema is 'undefined', treat as defined and do not prompt.
    if (isApiSelected && selectedConnection === 'undefined' && manualDbType === 'API' && selectedSchema !== 'undefined') {
      if (!apiEndpoint || !apiEndpoint.trim()) {
        toast({ variant: 'destructive', title: 'Provide an API endpoint in Details.' });
        return;
      }
    }
    // Build snippet reflecting actual runtime QueryBuilder API
    const connArg = selectedConnection && selectedConnection !== 'undefined' ? `'${selectedConnection}'` : '';
    let codeLines: string[] = [];
    // Show imports that callers need for the generated snippet
    codeLines.push(`import { Connection } from '@/lib/orm/query-builder';`);
    codeLines.push('');
    codeLines.push(`const conn = new Connection(${connArg});`);
    // Where clauses: honor simple or complex modes uniformly for all operations
      if (!isApiSelected) {
        const coll = selectedSchema && selectedSchema !== 'undefined' ? selectedSchema : effectiveCollection;
        codeLines.push(`let q = conn.collection('${coll}');`);
        if (whereMode === 'complex' && whereComplexJson.trim()) {
          codeLines.push(`q = q.whereComplex(\`${whereComplexJson}\`);`);
        } else {
          whereClauses.forEach(c => {
            if (c.field && c.value) {
              const vStr = isNaN(Number(c.value)) ? `'${c.value}'` : c.value;
              codeLines.push(`q = q.where('${c.field}', '${c.operator}', ${vStr});`);
            }
          });
        }
        if (sortBy && sortBy.field) codeLines.push(`q = q.sortBy('${sortBy.field}', '${sortBy.direction}');`);
        if (limit !== null && limit > 0) codeLines.push(`q = q.limit(${limit});`);
        if (offset !== null && offset >= 0) codeLines.push(`q = q.offset(${offset});`);
        const fieldsToFetch = fields.split(',').map(f => f.trim()).filter(Boolean);
        const fieldsArg = fieldsToFetch.map(f => `'${f}'`).join(', ');
        if (operation === 'get') {
          codeLines.push(`const docs = await q.get(${fieldsArg});`);
        } else if (operation === 'getOne') {
          codeLines.push(`const doc = await q.getOne(${fieldsArg});`);
        } else if (operation === 'update' || operation === 'updateOne') {
          const entries = updateFields.filter(f => f.field);
          const payload = entries.length > 0
            ? `{ ${entries.map(f => {
                const isNum = !isNaN(Number(f.value));
                return `'${f.field}': ${isNum ? f.value : `'${String(f.value).replace(/'/g, "\\'")}'`}`;
              }).join(', ')} }`
            : `{}`;
          if (operation === 'updateOne') {
            codeLines.push(`await q.updateByFilter(${payload}, true); // limit 1`);
          } else {
            codeLines.push(`await q.updateByFilter(${payload});`);
          }
        } else if (operation === 'delete' || operation === 'deleteOne') {
          if (operation === 'deleteOne') {
            codeLines.push(`await q.deleteByFilter(true); // limit 1`);
          } else {
            codeLines.push(`await q.deleteByFilter();`);
          }
        } else if (operation === 'add') {
          codeLines.push(`const id = await q.add(${addJson || '{}'});`);
        }
      } else {
        // API: derive resource based on rules
        codeLines.push(`// API connection: methods map to HTTP requests`);
        let resource: string | null = null;
        if (selectedConnection === 'undefined' && manualDbType === 'API' && selectedSchema !== 'undefined') {
          resource = apiEndpoint.trim();
        } else {
          const fallback = (selectedSchema && selectedSchema !== 'undefined') ? effectiveCollection : collectionName;
          resource = (apiEndpoint && apiEndpoint.trim()) ? apiEndpoint.trim() : (fallback || '/');
        }
        codeLines.push(`let q = conn.connection('${resource}');`);
      // query params
      if (apiQueryParams.length > 0) {
        const qpObj = apiQueryParams.filter(p => p.key && p.value).reduce((acc, cur) => ({ ...acc, [cur.key]: cur.value }), {} as Record<string,string>);
        codeLines.push(`q = q.queryParams(${JSON.stringify(qpObj)});`);
      }
      // body type for POST/PUT/PATCH
      if (operation === 'add' || operation === 'updateOne') {
        codeLines.push(`q = q.bodyType('${apiBodyType}');`);
      }
      if (operation === 'updateOne' && apiUpdateMethod === 'PATCH') {
        codeLines.push(`q = q.method('PATCH');`);
      }
      // Apply filters and options for API too
      if (whereMode === 'complex' && whereComplexJson.trim()) {
        codeLines.push(`q = q.whereComplex(\`${whereComplexJson}\`);`);
      } else {
        whereClauses.forEach(c => {
          if (c.field && c.value) {
            const vStr = isNaN(Number(c.value)) ? `'${c.value}'` : c.value;
            codeLines.push(`q = q.where('${c.field}', '${c.operator}', ${vStr});`);
          }
        });
      }
      if (sortBy && sortBy.field) codeLines.push(`q = q.sortBy('${sortBy.field}', '${sortBy.direction}');`);
      if (limit !== null && limit > 0) codeLines.push(`q = q.limit(${limit});`);
      if (offset !== null && offset >= 0) codeLines.push(`q = q.offset(${offset});`);
      if (operation === 'add' || operation === 'updateOne' || operation === 'update') {
        codeLines.push(`q = q.bodyType('${apiBodyType}');`);
      }
      if ((operation === 'updateOne' || operation === 'update') && apiUpdateMethod === 'PATCH') {
        codeLines.push(`q = q.method('PATCH');`);
      }
      if (operation === 'get') {
        codeLines.push(`const docs = await q.get();`);
      } else if (operation === 'add') {
        codeLines.push(`const id = await q.add(${addJson || '{}'});`);
      } else if (operation === 'update' || operation === 'updateOne') {
        const entries = updateFields.filter(f => f.field);
        const payload = entries.length > 0
          ? `{ ${entries.map(f => {
              const isNum = !isNaN(Number(f.value));
              const val = isNum ? f.value : `'$${''}${f.value.replace(/'/g, "\\'")}'`;
              return `'${f.field}': ${isNum ? f.value : `'${f.value.replace(/'/g, "\\'")}'`}`;
            }).join(', ')} }`
          : `{}`;
        if (operation === 'updateOne') {
          codeLines.push(`await q.updateByFilter(${payload}, true); // limit 1`);
        } else {
          codeLines.push(`await q.updateByFilter(${payload});`);
        }
      } else if (operation === 'delete' || operation === 'deleteOne') {
        if (operation === 'deleteOne') {
          codeLines.push(`await q.deleteByFilter(true); // limit 1`);
        } else {
          codeLines.push(`await q.deleteByFilter();`);
        }
      }
    }
    setGeneratedCode(codeLines.join('\n'));
  };

  // Step: Run the code using existing Connection helper
  const handleRun = async () => {
    if (!generatedCode) {
      toast({ variant: 'destructive', title: 'Generate code before running.' });
      return;
    }
    try {
      setShowResults(true);
      setLoading(true);
      setError(null);
      setResults([]);
      const connectionName = selectedConnection === 'undefined' ? undefined : selectedConnection ?? undefined;
      const fieldsToFetch = fields.split(',').map(f => f.trim()).filter(Boolean);
      let query: any;
      if (!isApiSelected) {
        query = new Connection(connectionName).collection(effectiveCollection);
      } else {
        // API: derive resource based on rules
        let resource: string | null = null;
        if (selectedConnection === 'undefined' && manualDbType === 'API' && selectedSchema !== 'undefined') {
          if (!apiEndpoint || !apiEndpoint.trim()) {
            toast({ variant: 'destructive', title: 'Provide an API endpoint in Details.' });
            setLoading(false);
            return;
          }
          resource = apiEndpoint.trim();
        } else {
          const fallback = (selectedSchema && selectedSchema !== 'undefined') ? effectiveCollection : collectionName;
          resource = (apiEndpoint && apiEndpoint.trim()) ? apiEndpoint.trim() : (fallback || '/');
        }
        query = new Connection(connectionName).connection(resource!);
      }
      if (whereMode === 'complex' && whereComplexJson.trim()) {
        query = query.whereComplex(whereComplexJson);
      } else {
        whereClauses.forEach(c => {
          if (c.field && c.value) {
            const numericValue = Number(c.value);
            const valueToUse = isNaN(numericValue) ? c.value : numericValue;
            query = query.where(c.field, c.operator, valueToUse);
          }
        });
      }
      if (sortBy && sortBy.field) query = query.sortBy(sortBy.field, sortBy.direction);
      if (limit !== null && limit > 0) query = query.limit(limit);
      if (offset !== null && offset >= 0) query = query.offset(offset);
      if (isApiSelected) {
        if (apiQueryParams.length > 0) {
          const qpObj = apiQueryParams.filter(p => p.key && p.value).reduce((acc, cur) => ({ ...acc, [cur.key]: cur.value }), {} as Record<string,string>);
          query = query.queryParams(qpObj);
        }
        if (operation === 'add' || operation === 'updateOne' || operation === 'update') {
          query = query.bodyType(apiBodyType);
        }
        if ((operation === 'updateOne' || operation === 'update') && apiUpdateMethod === 'PATCH') {
          query = query.method('PATCH');
        }
      }
      if (operation === 'get') {
        const docs = await query.get(...fieldsToFetch);
        setResults(Array.isArray(docs) ? docs : []);
      } else if (operation === 'getOne') {
        const doc = await query.getOne(...fieldsToFetch);
        setResults(doc ? [doc] : []);
      } else if (operation === 'update' || operation === 'updateOne') {
        const data = updateFields.filter(f => f.field).reduce((acc, f) => {
          const n = Number(f.value);
          acc[f.field] = isNaN(n) ? f.value : n;
          return acc;
        }, {} as Record<string, any>);
        await query.updateByFilter(data, operation === 'updateOne');
        toast({ title: 'Updated successfully', description: operation === 'updateOne' ? 'One matching document updated.' : 'Matching documents updated.' });
      } else if (operation === 'delete' || operation === 'deleteOne') {
        await query.deleteByFilter(operation === 'deleteOne');
        toast({ title: 'Deleted successfully', description: operation === 'deleteOne' ? 'One matching document deleted.' : 'Matching documents deleted.' });
      } else if (operation === 'add') {
        const data = addJson ? JSON.parse(addJson) : {};
        const res = await query.add(data);
        setResults(res ? (Array.isArray(res) ? res : [res]) : []);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Error');
      throw e; // as requested: for updates, surface errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Step 1: Show connections on line 1; schemas on line 2 (only if a connection is selected) */}
      <Card>
        <CardHeader>
          <CardTitle>Select From Connections and Schemas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium mb-2">select a connection</div>
          {/* Line 1: connections */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedConnection === 'undefined' ? 'default' : 'outline'}
              onClick={() => { setSelectedConnection('undefined'); setSelectedSchema(null); }}
            >
              connection::undefined
            </Button>
            {connections.map((name) => (
              <Button
                key={`conn-${name}`}
                variant={selectedConnection === name ? 'default' : 'outline'}
                onClick={() => { setSelectedConnection(name); setSelectedSchema(null); }}
              >
                {`connection::${name}`}
              </Button>
            ))}
          </div>

          {/* Line 2: schemas (only if a connection is selected) */}
          {selectedConnection !== null && (
            <div className="mt-3">
              <div className="text-sm font-medium mb-2">choose a schema</div>
              <div className="flex flex-wrap gap-2">
              {selectedConnection === 'undefined' && (
                <Button
                  variant={selectedSchema === 'undefined' ? 'default' : 'outline'}
                  onClick={() => setSelectedSchema('undefined')}
                >
                  schema::undefined
                </Button>
              )}
              {visibleSchemaNames.map((name) => (
                <Button
                  key={`schema-${name}`}
                  variant={selectedSchema === name ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedSchema(name);
                    if (selectedConnection === 'undefined') {
                      const assoc = schemaToConnection[name];
                      setSelectedConnection(assoc ?? null);
                    }
                  }}
                >
                  {`schema::${name}`}
                </Button>
              ))}
              </div>
            </div>
          )}
          {selectedConnection && (
            <div className="mt-3 text-sm text-muted-foreground">
              Type: <span className="font-medium">{selectedDbType ?? 'Unknown'}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Ask details based on selection and undefined type prompts (only after a selection) */}
      {selectedConnection !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Based on your choices above, fill required fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          

          {/* If connection is selected, show its type and API base path (if API) */}
          {selectedConnection && selectedConnection !== 'undefined' && (
            <div className="space-y-2">
              <div className="text-sm">Connection type: <span className="font-medium">{selectedDbType ?? 'Unknown'}</span></div>
              {selectedDbType === 'API' && (
                <div className="text-sm">Base URL: <span className="font-medium">{selectedApiBasePath ?? 'Unknown'}</span></div>
              )}
            </div>
          )}

          {/* If connection::undefined, ask type first using buttons */}
          {selectedConnection === 'undefined' && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Select connection type</div>
              <div className="flex flex-wrap gap-2">
                {(['Firestore', 'SQL', 'MongoDB', 'API'] as DbType[]).map((t) => (
                  <Button key={t} variant={manualDbType === t ? 'default' : 'outline'} onClick={() => setManualDbType(t)}>
                    {`type::${t}`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* schema::undefined does not require a separate schema type; operations derive from connection type */}

            {/* Show collection input below type selection when applicable (not for API) */}
            {selectedSchema === null && !isApiSelected && (
              (selectedConnection && selectedConnection !== 'undefined') ||
              (selectedConnection === 'undefined' && !!manualDbType)
            ) && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Collection / Table</div>
                <Input
                  placeholder="e.g., users or products"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                />
              </div>
            )}

            {/* API: endpoint input */}
            {selectedSchema !== 'undefined' && selectedConnection === 'undefined' && manualDbType === 'API' && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Endpoint</div>
                <Input
                  placeholder="/products or /products/{id}"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                />
              </div>
            )}

            {/* Show schema structure when a schema is selected (always visible, not collapsible) */}
            {selectedSchemaStructure && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Loaded Schema Structure</div>
                <pre className="rounded-md border bg-muted p-3 text-xs overflow-auto"><code>{JSON.stringify(selectedSchemaStructure, null, 2)}</code></pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Choose operation (shown only after details are provided) */}
      {canShowOperations && (
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>{isApiSelected ? 'HTTP requests' : 'Data operations'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {isApiSelected ? (
                <>
                  <Button variant={operation === 'get' ? 'default' : 'outline'} onClick={() => setOperation('get')}>GET</Button>
                  <Button variant={operation === 'add' ? 'default' : 'outline'} onClick={() => setOperation('add')}>POST</Button>
                  <Button variant={operation === 'updateOne' ? 'default' : 'outline'} onClick={() => setOperation('updateOne')}>PUT (one)</Button>
                  <Button variant={operation === 'deleteOne' ? 'default' : 'outline'} onClick={() => setOperation('deleteOne')}>DELETE (one)</Button>
                  <Button variant={operation === 'update' ? 'default' : 'outline'} onClick={() => setOperation('update')}>UPDATE (filters)</Button>
                  <Button variant={operation === 'delete' ? 'default' : 'outline'} onClick={() => setOperation('delete')}>DELETE (filters)</Button>
                </>
              ) : (
                (['get', 'getOne', 'update', 'updateOne', 'delete', 'deleteOne', 'add'] as Operation[]).map((op) => (
                  <Button
                    key={op}
                    variant={operation === op ? 'default' : 'outline'}
                    onClick={() => setOperation(op)}
                  >
                    {op}
                  </Button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Fill form (no connection selection here) */}
      {operation && (
        <Card>
          <CardHeader>
            <CardTitle>Fill Parameters</CardTitle>
            <CardDescription>{isApiSelected ? 'Provide request inputs when required.' : 'Provide filters, fields, and options.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(operation === 'get' || operation === 'getOne') && !isApiSelected && (
              <>
                <Input
                  placeholder="Fields to fetch (comma-separated)"
                  value={fields}
                  onChange={(e) => setFields(e.target.value)}
                />
                {/* Reveal buttons for parameter sections */}
                <div className="flex flex-wrap gap-2">
                  {!showWhere && (
                    <Button variant="outline" onClick={() => { setShowWhere(true); setWhereMode('none'); }}>
                      Add Where Clause
                    </Button>
                  )}
                  {!showLimit && (
                    <Button variant="outline" onClick={() => setShowLimit(true)}>
                      Add Limit Clause
                    </Button>
                  )}
                  {!showOffset && (
                    <Button variant="outline" onClick={() => setShowOffset(true)}>
                      Add Offset Clause
                    </Button>
                  )}
                  {!showSort && (
                    <Button variant="outline" onClick={() => setShowSort(true)}>
                      Add SortBy Clause
                    </Button>
                  )}
                </div>

                {/* Where section */}
                {showWhere && (
                  <div className="space-y-3 pt-2">
                    <div className="text-sm font-medium">Where</div>
                    <div className="flex flex-wrap gap-2">
                      {whereMode !== 'simple' && (
                        <Button variant="outline" onClick={() => { setWhereMode('simple'); setWhereComplexJson(''); }}>
                          Add Where Condition
                        </Button>
                      )}
                      {whereMode !== 'complex' && (
                        <Button variant="outline" onClick={() => { setWhereMode('complex'); setWhereClauses([]); }}>
                          Add Where Complex
                        </Button>
                      )}
                    </div>
                    {whereMode === 'simple' && (
                      <div className="space-y-3">
                        {whereClauses.map((c, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              placeholder="field"
                              value={c.field}
                              onChange={(e) => updateWhereClause(i, { field: e.target.value })}
                            />
                            <Select value={c.operator} onValueChange={(val) => updateWhereClause(i, { operator: val as any })}>
                              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {['==', '!=', '<', '>', '<=', '>='].map((op) => (
                                  <SelectItem key={op} value={op}>{op}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="value"
                              value={c.value}
                              onChange={(e) => updateWhereClause(i, { value: e.target.value })}
                            />
                            <Button variant="ghost" onClick={() => removeWhereClause(i)}>Remove</Button>
                          </div>
                        ))}
                        <Button variant="outline" onClick={addWhereClause}>Add Condition</Button>
                        <div className="text-xs text-muted-foreground">Multiple conditions combine with AND.</div>
                      </div>
                    )}
                    {whereMode === 'complex' && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Complex Where JSON"
                          value={whereComplexJson}
                          onChange={(e) => setWhereComplexJson(e.target.value)}
                        />
                        <div className="text-xs text-muted-foreground">Provide advanced filters; simple conditions are disabled.</div>
                      </div>
                    )}
                  </div>
                )}

                {/* SortBy section */}
                {showSort && (
                  <div className="flex gap-2 pt-2">
                    <Input placeholder="Sort field" value={sortBy?.field ?? ''} onChange={(e) => setSortBy({ field: e.target.value, direction: sortBy?.direction ?? 'asc' })} />
                    <Select value={sortBy?.direction ?? 'asc'} onValueChange={(val) => setSortBy({ field: sortBy?.field ?? '', direction: val as any })}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">asc</SelectItem>
                        <SelectItem value="desc">desc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Limit section */}
                {showLimit && (
                  <div className="pt-2">
                    <Input placeholder="Limit" value={limit ?? ''} onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                )}

                {/* Offset section */}
                {showOffset && (
                  <div className="pt-2">
                    <Input placeholder="Offset" value={offset ?? ''} onChange={(e) => setOffset(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                )}
              </>
            )}

            {/* Mutation Where (supports multiple clauses and complex) */}
            {(operation === 'update' || operation === 'delete' || operation === 'updateOne' || operation === 'deleteOne') && (
              <>
                {/* Reveal buttons for parameter sections */}
                <div className="flex flex-wrap gap-2">
                  {!showWhere && (
                    <Button variant="outline" onClick={() => { setShowWhere(true); setWhereMode('none'); }}>
                      Add Where Clause
                    </Button>
                  )}
                  {!showLimit && (
                    <Button variant="outline" onClick={() => setShowLimit(true)}>
                      Add Limit Clause
                    </Button>
                  )}
                  {!showOffset && (
                    <Button variant="outline" onClick={() => setShowOffset(true)}>
                      Add Offset Clause
                    </Button>
                  )}
                </div>

                {/* Where section */}
                {showWhere && (
                  <div className="space-y-3 pt-2">
                    <div className="text-sm font-medium">Where</div>
                    <div className="flex flex-wrap gap-2">
                      {whereMode === 'none' && (
                        <>
                          <Button variant="outline" onClick={() => { setWhereMode('simple'); setWhereComplexJson(''); }}>
                            Add Where Clause
                          </Button>
                          <Button variant="outline" onClick={() => { setWhereMode('complex'); setWhereClauses([]); }}>
                            Add Where Complex
                          </Button>
                        </>
                      )}
                    </div>
                    {whereMode === 'simple' && (
                      <div className="space-y-3">
                        {whereClauses.map((c, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              placeholder="field"
                              value={c.field}
                              onChange={(e) => updateWhereClause(i, { field: e.target.value })}
                            />
                            <Select value={c.operator} onValueChange={(val) => updateWhereClause(i, { operator: val as any })}>
                              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {['==', '!=', '<', '>', '<=', '>='].map((op) => (
                                  <SelectItem key={op} value={op}>{op}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="value"
                              value={c.value}
                              onChange={(e) => updateWhereClause(i, { value: e.target.value })}
                            />
                            <Button variant="ghost" onClick={() => removeWhereClause(i)}>Remove</Button>
                          </div>
                        ))}
                        <Button variant="outline" onClick={addWhereClause}>Add Clause</Button>
                        <div className="text-xs text-muted-foreground">Multiple clauses combine with AND.</div>
                      </div>
                    )}
                    {whereMode === 'complex' && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Complex Where JSON"
                          value={whereComplexJson}
                          onChange={(e) => setWhereComplexJson(e.target.value)}
                        />
                        <div className="text-xs text-muted-foreground">Provide advanced filters; simple clauses are disabled.</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {(operation === 'update' || operation === 'updateOne') && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Update Fields</div>
                <div className="space-y-2">
                  {updateFields.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="field" value={p.field} onChange={(e) => {
                        const next = [...updateFields]; next[i] = { ...next[i], field: e.target.value }; setUpdateFields(next);
                      }} />
                      <Input placeholder="value" value={p.value} onChange={(e) => {
                        const next = [...updateFields]; next[i] = { ...next[i], value: e.target.value }; setUpdateFields(next);
                      }} />
                      <Button variant="ghost" onClick={() => setUpdateFields(updateFields.filter((_, idx) => idx !== i))}>Remove</Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => setUpdateFields([...updateFields, { field: '', value: '' }])}>Add Field</Button>
                </div>
                <div className="text-xs text-muted-foreground">Add multiple fields to set; values can be strings or numbers.</div>
              </div>
            )}

            {(operation === 'delete' || operation === 'deleteOne') && (
              <div className="text-xs text-muted-foreground">Where clauses target documents; deleteOne limits to 1.</div>
            )}

            {(operation === 'update' || operation === 'updateOne' || operation === 'delete' || operation === 'deleteOne') && (
              <>
                {/* Limit section for mutations */}
                {showLimit && (
                  <div className="pt-2">
                    <Input placeholder="Limit" value={limit ?? ''} onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                )}
                {/* Offset section for mutations */}
                {showOffset && (
                  <div className="pt-2">
                    <Input placeholder="Offset" value={offset ?? ''} onChange={(e) => setOffset(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                )}
              </>
            )}

            {operation === 'add' && (
              <Textarea placeholder="Add JSON" value={addJson} onChange={(e) => setAddJson(e.target.value)} />
            )}

            {/* API-specific parameter editors */}
            {isApiSelected && (
              <div className="space-y-4">
                {(operation === 'get' || operation === 'delete' || operation === 'deleteOne' || operation === 'add' || operation === 'update' || operation === 'updateOne') && (
                  <div>
                    <div className="text-sm font-medium mb-2">Query Parameters</div>
                    <div className="space-y-2">
                      {apiQueryParams.map((p, i) => (
                        <div key={i} className="flex gap-2">
                          <Input placeholder="key" value={p.key} onChange={(e) => {
                            const next = [...apiQueryParams]; next[i] = { ...next[i], key: e.target.value }; setApiQueryParams(next);
                          }} />
                          <Input placeholder="value" value={p.value} onChange={(e) => {
                            const next = [...apiQueryParams]; next[i] = { ...next[i], value: e.target.value }; setApiQueryParams(next);
                          }} />
                          <Button variant="ghost" onClick={() => setApiQueryParams(apiQueryParams.filter((_, idx) => idx !== i))}>Remove</Button>
                        </div>
                      ))}
                      <Button variant="outline" onClick={() => setApiQueryParams([...apiQueryParams, { key: '', value: '' }])}>Add Parameter</Button>
                    </div>
                  </div>
                )}
                {(operation === 'add' || operation === 'updateOne') && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Body Type</div>
                    <div className="flex flex-wrap gap-2">
                      {(['json', 'form', 'urlencoded'] as const).map(bt => (
                        <Button key={bt} variant={apiBodyType === bt ? 'default' : 'outline'} onClick={() => setApiBodyType(bt)}>
                          {bt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {operation === 'updateOne' && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Update Method</div>
                    <div className="flex flex-wrap gap-2">
                      {(['PUT', 'PATCH'] as const).map(m => (
                        <Button key={m} variant={apiUpdateMethod === m ? 'default' : 'outline'} onClick={() => setApiUpdateMethod(m)}>
                          {m}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Generate Code */}
            <div className="flex items-center gap-3">
              <Button onClick={handleGenerateCode} variant="secondary">
                <Wand2 className="mr-2 h-4 w-4" /> Generate Code
              </Button>
            </div>

            {generatedCode && (
              <pre className="mt-3 rounded-md border bg-muted p-3 text-xs"><code>{generatedCode}</code></pre>
            )}

            {/* Show Run Code button below the generated code */}
            {generatedCode && (
              <div className="mt-3">
                <Button onClick={handleRun} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Run Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section (separate section, only visible after Run Code) */}
      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {isApiSelected
                ? (selectedApiBasePath ? `Responses from API: ${selectedApiBasePath}` : 'Responses from API requests.')
                : (effectiveCollection ? `Documents from '${effectiveCollection}'.` : 'Your query results will appear here.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && results.length === 0 && !error ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-destructive-foreground bg-destructive/90 p-3 rounded-md text-sm">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((r, idx) => (
                  <pre key={idx} className="rounded-md border bg-muted p-3 text-xs overflow-auto"><code>{JSON.stringify(r, null, 2)}</code></pre>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No results yet. Generate and run code to see output here.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
