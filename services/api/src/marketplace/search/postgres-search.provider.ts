import { Injectable } from '@nestjs/common';
import { SearchProvider, SearchQueryParams } from './search.provider';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostgresSearchProvider implements SearchProvider {
  constructor(private prisma: PrismaService) {}

  async search(params: SearchQueryParams): Promise<any[]> {
    const {
      query,
      category,
      tags,
      badges,
      visibility = 'PUBLIC',
      limit = 20,
      offset = 0,
    } = params;

    let sqlQuery = `
      SELECT t.*, 
             a."trendingScore", a."qualityScore", a."trustScore"
      FROM "Template" t
      LEFT JOIN "TemplateAnalytics" a ON a."templateId" = t.id
      WHERE t."deletedAt" IS NULL
        AND t."status" = 'PUBLISHED'
        AND t."visibility" = $1
    `;
    const queryParams: any[] = [visibility];
    let paramIdx = 2;

    if (query) {
      // Basic Postgres FTS using to_tsvector and to_tsquery
      const formattedQuery = query
        .split(' ')
        .map((term) => term + ':*')
        .join(' & ');
      sqlQuery += ` AND to_tsvector('english', t.name || ' ' || coalesce(t.description, '')) @@ to_tsquery('english', $${paramIdx})`;
      queryParams.push(formattedQuery);
      paramIdx++;
    }

    if (category) {
      sqlQuery += ` AND t.category = $${paramIdx}`;
      queryParams.push(category);
      paramIdx++;
    }

    // Sort by ranking signals (trust, quality, trending)
    sqlQuery += ` ORDER BY a."trustScore" DESC NULLS LAST, a."trendingScore" DESC NULLS LAST, a."qualityScore" DESC NULLS LAST LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    queryParams.push(limit, offset);

    return this.prisma.$queryRawUnsafe(sqlQuery, ...queryParams);
  }
}
