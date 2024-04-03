/**
 * 是否是元素类型
 * @param node
 * @returns
 */
export function isElement(node: Node): node is Element {
  return node instanceof Element && node.nodeType === Node.ELEMENT_NODE
}

/**
 * 是否是span元素
 * @param node
 * @returns boolean
 */
export function isSpanElement(node: Node): node is HTMLSpanElement {
  return isElement(node) && node.tagName.toLowerCase() === 'span'
}

/**
 * 是否是br元素
 * @param node
 * @returns boolean
 */
export function isBrElement(node: Node): node is HTMLBRElement {
  return isElement(node) && node.tagName.toLowerCase() === 'br'
}

/**
 * 是否为svg元素节点
 * @param node
 * @returns boolean
 */
export function isSVGElement(node: Element): node is SVGElement {
  return typeof (node as SVGElement).className === 'object'
}

/**
 * 是否为HTML元素节点
 * @param node
 * @returns boolean
 */
export function isHTMLElement(node: Node): node is HTMLElement {
  return (
    isElement(node) &&
    typeof (node as HTMLElement).style !== 'undefined' &&
    !isSVGElement(node)
  )
}

/**
 * 是否为图片元素
 * @param node
 * @returns boolean
 */
export function isImageElement(node: Element): node is HTMLImageElement {
  return node.tagName.toLowerCase() === 'img'
}

/**
 * 创建一个span元素
 * @param content
 * @param classNames
 * @returns Element
 */
export function createSpanElement(content: string, classNames: string[] = []) {
  const span = document.createElement('span')
  span.innerText = content
  span.classList.add(...classNames)
  return span
}
