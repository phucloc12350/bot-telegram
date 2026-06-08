import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function jsonOk(data, init) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonError(status, message, details) {
  return NextResponse.json(
    { success: false, error: { message, details } },
    { status },
  );
}

export function handleApiError(err) {
  if (err instanceof ApiError) {
    return jsonError(err.status, err.message, err.details);
  }
  console.error('[API ERROR]', err);
  return jsonError(500, 'Lỗi máy chủ. Vui lòng thử lại sau.');
}
