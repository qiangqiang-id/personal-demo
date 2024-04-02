import {
  INVALID_INDEX,
  TYPE_PROP,
} from '@/pages/RichTextInsertBlock/RichTextInsertBlock'
import { NormalizedRange } from '@/types/Range'
import BlockType from '@/constants/RichTextBlockTypeEnum'
import { isBrElement, isSpanElement } from './Element'
import { AliasBlock, Block, Blocks, BreakBlock, TextBlock } from '@/types/Block'

const { ALIAS, BREAK, TEXT } = BlockType

/**
 * 是否包含
 * @param parent 父级
 * @param descendant 子集
 * @returns boolean
 */
export function contains(parent: Node, descendant: Node) {
  return parent.contains(descendant)
}

/**
 * 是否是别名
 * @param type
 * @returns boolean
 */
export function isAliasBlock(type?: string): type is BlockType.ALIAS {
  return type === ALIAS
}

/**
 * 是否是停顿
 * @param type
 * @returns boolean
 */
export function isBreakBlock(type?: string): type is BlockType.BREAK {
  return type === BREAK
}

/**
 * 是否是纯文本
 * @param type
 * @returns boolean
 */
export function isTextBlock(type?: string): type is BlockType.TEXT {
  return type === TEXT
}

/**
 * 是否是不可以编辑元素
 * @param type
 * @returns boolean
 *  */
export function isNotEditable(type?: string) {
  return isAliasBlock(type) || isBreakBlock(type)
}

/**
 * 是否是纯文本数据
 * @param data
 * @returns boolean
 */
export function isTextBlockData(data: Block): data is TextBlock {
  return isTextBlock(data.type)
}

/**
 * 是否是停顿数据
 * @param data
 * @returns boolean
 */
export function isBreakBlockData(data: Block): data is BreakBlock {
  return isBreakBlock(data.type)
}

/**
 * 是否是别名数据
 * @param data
 * @returns boolean
 */
export function isAliasBlockData(data: Block): data is AliasBlock {
  return isAliasBlock(data.type)
}

/**
 * 获取富文本中的 range
 * @param root 更节点
 * @returns
 */
export function getSelectionRangeInRoot(root: Node): NormalizedRange | null {
  const selection = window.getSelection()
  if (!selection || !selection?.getRangeAt || !selection.rangeCount) return null

  const nativeRange = selection.getRangeAt(0)

  const { startContainer, collapsed, endContainer, startOffset, endOffset } =
    nativeRange

  if (
    !contains(root, startContainer) ||
    (!collapsed && !contains(root, endContainer))
  ) {
    return null
  }

  const optimizePosition = (node: Node, offset: number) => {
    while (!(node instanceof Text) && node.childNodes.length > 0) {
      if (node.childNodes.length > offset) {
        node = node.childNodes[offset]
        offset = 0
      } else if (node.childNodes.length === offset) {
        node = node.lastChild as Node
        if (node instanceof Text) {
          offset = node.data.length
        } else if (node.childNodes.length > 0) {
          /** Container case */
          offset = node.childNodes.length
        } else {
          /** Embed case */
          offset = node.childNodes.length + 1
        }
      } else {
        break
      }
    }

    return {
      node,
      offset,
    }
  }

  return {
    start: optimizePosition(startContainer, startOffset),
    end: optimizePosition(endContainer, endOffset),
    native: nativeRange,
  }
}

/**
 * 获取在父级中的偏移位置
 * @param root 顶层父级
 * @param node 节点
 * @param offset 偏移
 * @returns offset 基于父级中的偏移
 */
export function getOffsetInRoot(root: Node, node: Node, offset: number) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ALL,
    (node: Node) => {
      /**  过滤不能编辑元素的子集  */
      const type = node.parentElement?.getAttribute(TYPE_PROP)
      if (type && isNotEditable(type)) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    }
  )

  if (root === node) return offset

  let index = 0
  let isEnd = false

  while (!isEnd && treeWalker.nextNode()) {
    const current = treeWalker.currentNode

    if (current === node) {
      index += offset
      isEnd = true
      break
    }

    /** 文字 */
    if (current instanceof Text) {
      const textLength = current.textContent?.length
      textLength && (index += textLength)
    }

    if (isSpanElement(current)) {
      const type = current.getAttribute(TYPE_PROP)

      if (type && isNotEditable(type)) {
        /**
         * 如果是不能编辑元素，并且包含当前元素，说明已找到，直接退出
         *  */
        if (contains(current, node)) {
          index += offset
          isEnd = true
          break
        }

        /** 如果不包含，不能编辑元素偏移算 1 */
        index += 1
      }
    }

    /** 换行 */
    if (isBrElement(current)) {
      index += 1
    }
  }

  return index
}

/**
 * 文本超过最大显示字符数，显示省略号
 * @param text
 * @param max
 * @returns {string}
 */
export function ellipsis(text: string | undefined, max: number) {
  let str = text || ''
  if (text !== undefined && text.length > max) {
    str = `${text.substring(0, max)}...`
  }
  return str
}

/**
 * 检查并添加 <br> 标签
 * @param {Element} container
 */
export function ensureBrAtEnd(container: Element) {
  const lastChild = container.lastChild as Element

  if (!lastChild || !isBrElement(lastChild)) {
    const br = document.createElement('br')
    container.appendChild(br)
  }
}

/**
 * 设置光标
 * @param node
 * @param offset
 */
export function setCursorByOffset(node: Node, offset: number) {
  const range = document.createRange()
  const selection = window.getSelection()

  /** 选择指定元素的全部内容 */
  range.selectNodeContents(node)

  /** 折叠光标到指定位置 */
  range.collapse(true)

  /** 移动光标到指定位置 */
  range.setStart(node, offset)
  range.setEnd(node, offset)

  /** 清除当前选区 */
  selection?.removeAllRanges()

  /** 添加新的选区 */
  selection?.addRange(range)
}

/**
 * range 选中的文本范围是否存在换行
 * @param range 选中范围
 * @returns {boolean}
 */
export function isTextWithNewlinesForRange(range: Range) {
  const contents = range.cloneContents()
  const div = document.createElement('div')
  div.appendChild(contents)
  const textWithNewlines = div.innerHTML.replace(/<br>/g, '\n')

  return (
    textWithNewlines.search(/\n/g) > INVALID_INDEX ||
    range.toString().search(/\n/g) > INVALID_INDEX
  )
}

/**
 * 合并连续的纯文本
 * @param textList 文本列表
 * @returns {AllText[]}
 */
export function mergePlainText(textList: Blocks) {
  if (!textList.length) return []

  const newList: Blocks = []
  let pre: Block = textList[0]
  textList.forEach((item, index) => {
    if (index === 0) return
    if (isTextBlockData(pre) && isTextBlockData(item)) {
      pre = { type: TEXT, text: pre.text + item.text }
    } else {
      newList.push(pre)
      pre = item
    }
  })

  newList.push(pre)

  return newList
}

/**
 * 过滤有效的node
 * @param nodes 节点集合
 * @returns
 */
export function filterValidityBlocksNode(nodes: ChildNode[]) {
  return nodes.filter((block) => {
    /** 如果是元素，必须有type */
    if (block instanceof Element) {
      const type = block.getAttribute(TYPE_PROP)
      return !!type && [BREAK, TEXT, ALIAS].includes(type as BlockType)
    }

    /** 文字 */
    if (block instanceof Text) return true

    return false
  })
}

/**
 * 获取block字符长度
 * @param block
 * @returns
 */
export function getItemTextLength(block: Block) {
  /** 如果是不可编辑元素，长度只算1，与 getOffsetInRoot 方法统一规则  */
  return isTextBlockData(block) ? block.text.length : 1
}

/**
 * 更改block 内容
 * @param content 需要更新的内容
 * @param data block 对象
 * @returns
 */
export function changeBlockContent(content: string, data: Block) {
  const block = { ...data }

  if (isAliasBlockData(block) || isTextBlockData(block)) {
    block.text = content
  }

  if (isBreakBlockData(block)) {
    block.durationMS = parseFloat(content)
  }

  return block
}
