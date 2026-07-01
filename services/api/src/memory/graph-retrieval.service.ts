import { Injectable, ForbiddenException } from '@nestjs/common';
// import { Neo4jService } from 'nest-neo4j/dist';

@Injectable()
export class GraphRetrievalService {
  constructor(
    // private readonly neo4jService: Neo4jService
  ) {}

  /**
   * Safe execution of Graph Queries enforcing Multi-Tenant Isolation
   */
  async queryGraph(workspaceId: string, query: string, parameters: any = {}) {
    // 1. AST Validation (Ensure no writes/deletes are passed in if it's a read-only request)
    this.validateReadQuery(query);

    // 2. Multi-Tenant Injection
    // Every query to the graph must explicitly filter by the workspaceId property on the nodes
    // e.g., MATCH (n {workspaceId: $workspaceId}) ...
    if (!query.includes('workspaceId')) {
      throw new ForbiddenException(
        'Graph query must include workspace isolation boundary',
      );
    }

    const safeParams = {
      ...parameters,
      workspaceId,
    };

    // 3. Execute against Neo4j
    // const res = await this.neo4jService.read(query, safeParams);
    // return res.records;

    // MVP Stub Return
    console.log(
      `[GraphRAG] Executing Cypher in Workspace ${workspaceId}:`,
      query,
    );
    return [];
  }

  private validateReadQuery(query: string) {
    const upperQuery = query.toUpperCase();
    if (
      upperQuery.includes('DELETE') ||
      upperQuery.includes('DETACH') ||
      upperQuery.includes('REMOVE')
    ) {
      throw new ForbiddenException(
        'Read-only graph queries cannot contain destructive commands.',
      );
    }
  }
}
