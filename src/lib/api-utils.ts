/**
 * Shared API utilities for consistent patterns across all route handlers
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ZodError } from 'zod'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

// ============================================================================
// Type Definitions
// ============================================================================

export interface ApiErrorResponse {
  success: false
  error: string
  errors?: Record<string, string[]>
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
}

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Higher-order function that wraps route handlers with authentication
 * Ensures consistent auth checking across all protected routes
 */
export function withAuth<T>(
  handler: (userId: string, request: NextRequest, params?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: T }): Promise<NextResponse> => {
    try {
      const session = await getServerSession(authOptions)

      if (!session || !session.user?.id) {
        return apiError('Unauthorized - Please sign in', 401)
      }

      const userId = session.user.id
      return await handler(userId, request, context?.params)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return apiError('Internal server error', 500)
    }
  }
}

// ============================================================================
// Error Handlers
// ============================================================================

/**
 * Handle Zod validation errors and convert to structured error response
 */
export function handleZodError(error: ZodError): NextResponse<ApiErrorResponse> {
  const fieldErrors = error.flatten().fieldErrors
  const errors: Record<string, string[]> = {}

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages) {
      errors[field] = messages
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      errors,
    },
    { status: 422 }
  )
}

/**
 * Handle Prisma errors and map to appropriate HTTP status codes
 */
export function handlePrismaError(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        return apiError('A record with this value already exists', 409)
      case 'P2025':
        // Record not found
        return apiError('Record not found', 404)
      case 'P2003':
        // Foreign key constraint violation
        return apiError('Invalid reference - related record does not exist', 400)
      default:
        console.error('Prisma error:', error)
        return apiError('Database error', 500)
    }
  }

  console.error('Unknown error:', error)
  return apiError('Internal server error', 500)
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create a successful API response
 */
export function apiResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

/**
 * Create an error API response
 */
export function apiError(
  message: string,
  status = 500,
  errors?: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errors,
    },
    { status }
  )
}

// ============================================================================
// Pagination Utilities
// ============================================================================

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Build a paginated response with consistent structure
 */
export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  status = 200
): NextResponse<ApiSuccessResponse<PaginatedData<T>>> {
  const hasMore = page * limit < total

  return NextResponse.json(
    {
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        hasMore,
      },
    },
    { status }
  )
}

// ============================================================================
// Request Body Parsing
// ============================================================================

/**
 * Parse JSON body from request with error handling
 */
export async function parseJsonBody<T = unknown>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json()
  } catch (error) {
    console.error('Failed to parse JSON body:', error)
    return null
  }
}
