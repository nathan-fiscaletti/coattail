class SchemaCompiler {
    constructor(rootSchema) {
        this.rootSchema = rootSchema;
        this.schemas = [];
    }

    addSchema(schema, id) {
        id = id || schema.$id || schema.id;
        if (id === undefined) {
            throw new Error('missing schema id');
        }
        this.schemas[id] = schema; 
    }

    compile() {
        const _compile = (schema) => {
            const annotationKeyWords = ['id', '$id', '$comment'];
            for (const annotationKeyWord of annotationKeyWords) {
                delete schema[annotationKeyWord];
            }

            let resolveFailures = [];
            const compiled = schema;
            Object.entries(schema).forEach(([key, val]) => {
                if (typeof val === 'object' && !Array.isArray(val)) {
                    if (val.$ref !== undefined) {
                        if (this.schemas[val.$ref]) {
                            const { 
                                compiled: _compiled,
                                resolveFailures: _resolveFailures
                            } = _compile(this.schemas[val.$ref]);
                            _resolveFailures.forEach(id => resolveFailures.push(id));
                            compiled[key] = _compiled;
                        } else {
                            resolveFailures.push(val.$ref);
                            const { 
                                compiled: _compiled,
                                resolveFailures: _resolveFailures
                            } = _compile(val);
                            _resolveFailures.forEach(id => resolveFailures.push(id));
                            compiled[key] = _compiled;
                        }
                    } else {
                        const { 
                            compiled: _compiled,
                            resolveFailures: _resolveFailures
                        } = _compile(val);
                        _resolveFailures.forEach(id => resolveFailures.push(id));
                        compiled[key] = _compiled;
                    }
                }
            });
    
            return { compiled, resolveFailures };
        };

        const { compiled, resolveFailures } = _compile(this.rootSchema);
        return {
            compiled,
            warnings: [... new Set(resolveFailures)].map(
                id => new Error(`Failed to resolve schema with ID ${id}.`)
            )
        };
    }
}

module.exports = SchemaCompiler;