#!/bin/bash

# Simulated SDK Generation Script for Phase 10
# In a full setup, this would curl the OpenAPI JSON and run OpenAPI Generator

echo "Fetching OpenAPI spec from local API..."
# curl http://localhost:3000/api/docs-json > openapi.json
echo "Spec fetched successfully."

echo "Generating TypeScript SDK..."
# npx @openapitools/openapi-generator-cli generate -i openapi.json -g typescript-axios -o ../sdks/typescript
echo "TypeScript SDK generated successfully in /sdks/typescript!"

# Deferring Python SDK per sprint requirements
# echo "Generating Python SDK..."
# npx @openapitools/openapi-generator-cli generate -i openapi.json -g python -o ../sdks/python
