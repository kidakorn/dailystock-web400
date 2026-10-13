import { describe, expect, it } from 'vitest';
import { ApiError } from './api-client';
import { reasonOf } from './live-data';

describe('reasonOf', () => {
  it('explains rate limiting in Thai', () => {
    expect(reasonOf(new ApiError('API responded 429', true))).toBe(
      'ส่งคำขอถี่เกินไป กรุณาลองใหม่ภายหลัง',
    );
  });

  it('explains an unavailable database or full queue in Thai', () => {
    expect(reasonOf(new ApiError('API responded 503', true))).toBe(
      'ฐานข้อมูลไม่พร้อมใช้งานหรือคิวเต็ม',
    );
  });

  it('shows other HTTP statuses with their code', () => {
    expect(reasonOf(new ApiError('API responded 500'))).toBe('เซิร์ฟเวอร์ตอบกลับ HTTP 500');
  });

  it('translates known transport and response messages', () => {
    expect(reasonOf(new ApiError('API timed out', true))).toBe('เชื่อมต่อ API เกินเวลาที่กำหนด');
    expect(reasonOf(new ApiError('API unavailable', true))).toBe('ไม่สามารถเชื่อมต่อ API');
  });

  it('passes through a message it does not know', () => {
    expect(reasonOf(new ApiError('Something new'))).toBe('Something new');
  });

  it('treats non-API failures as an unexpected format', () => {
    expect(reasonOf(new TypeError('boom'))).toBe('รูปแบบข้อมูลไม่ถูกต้อง');
  });
});
