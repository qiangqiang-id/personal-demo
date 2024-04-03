import { isElement } from '@/utils/Element'

/**
 * 获取文档
 * @param target
 * @returns boolean
 */
export function getDocument<T extends Node>(target?: T | null): Document {
  if (target) {
    return (isElement(target) ? target.ownerDocument : target) as Document
  }
  return window.document
}
