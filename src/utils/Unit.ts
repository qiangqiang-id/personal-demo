import { KILO } from '@/constants/CommonNum'

/**
 * 毫秒转秒
 * @param ms 毫秒
 * @returns {number} s
 */
export function msToS(ms: number) {
  return ms / KILO
}

/**
 * 秒转毫秒
 * @param s 秒
 * @returns {number} ms
 */
export function sToMs(s: number) {
  return s * KILO
}
