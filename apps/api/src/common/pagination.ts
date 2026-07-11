import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  cursor?: string;
}

export interface Page<T> {
  data: T[];
  meta: { nextCursor: string | null };
}

/**
 * Cursor pagination helper for uuid-v7 (time-ordered) primary keys:
 * fetch limit+1 rows ordered by id, the extra row's id becomes the cursor.
 */
export function toPage<T extends { id: string }>(rows: T[], limit: number): Page<T> {
  if (rows.length > limit) {
    const data = rows.slice(0, limit);
    return { data, meta: { nextCursor: data[data.length - 1]?.id ?? null } };
  }
  return { data: rows, meta: { nextCursor: null } };
}
