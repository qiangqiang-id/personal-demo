import {
  useRef,
  useState,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent,
} from 'react'
import { Button, message } from 'antd'
import { useDebounceFn } from 'ahooks'
import { NormalizedRange, Position, SelectRange } from '@/types/Range'
import {
  changeBlockContent,
  ellipsis,
  ensureBrAtEnd,
  filterValidityBlocksNode,
  getItemTextLength,
  getOffsetInRoot,
  getSelectionRangeInRoot,
  isAliasBlock,
  isAliasBlockData,
  isBreakBlock,
  isBreakBlockData,
  isNotEditable,
  isTextBlock,
  isTextBlockData,
  isTextWithNewlinesForRange,
  mergePlainText,
  setCursorByOffset,
} from '@/utils/RichTextInsertBlock'
import { Blocks, Block } from '@/types/Block'
import BlockType from '@/constants/RichTextBlockTypeEnum'
import { msToS, sToMs } from '@/utils/Unit'
import { createSpanElement, isBrElement } from '@/utils/Element'
import TextBlockPopover from './TextBlockPopover'

import Style from './RichTextInsertBlock.module.less'

const { ALIAS, BREAK, TEXT } = BlockType

export const TYPE_PROP = 'data-type'
/** 别名的完整内容 */
export const ALIAS_CONTENT = 'data-content'

/** 无效的索引 */
export const INVALID_INDEX = -1

/** 最大渲染别名长度 */
export const MAX_RENDER_ALIAS_LENGTH = 7

/** 默认暂停时间 毫秒*/
export const DEFAULT_PAUSE_TIME_MS = 500

/** 最大选择别名长度 */
export const MAX_ALIAS_TEXT_LENGTH = 30

/** 删除键 */
export const BACKSPACE_KEY = 'Backspace'
export const DELETE_KEY = 'Delete'

let blocks: Blocks = [
  {
    type: TEXT,
    text: '大家好，我是一名',
  },
  {
    type: ALIAS,
    text: '程序员',
    alias: '工程师',
  },
  {
    type: TEXT,
    text: '，这是我预研的',
  },
  {
    type: BREAK,
    durationMS: DEFAULT_PAUSE_TIME_MS,
  },
  {
    type: TEXT,
    text: '富文本插块功能',
  },
]

export default function RichTextInsertBlock() {
  /** 当前编辑的类型 */
  const [editType, setEditType] = useState<BlockType | null>(null)

  /** 选中的阴影矩形列表 */
  const [selectDOMRectList, setSelectDOMRectList] = useState<DOMRect[]>()

  /** popover visible */
  const [openPopover, setOpenPopover] = useState(false)

  /** 是否是更新块 */
  const [isUpdateBlock, setIsUpdateBlock] = useState(false)

  /** 别名数据 */
  const [aliasText, setAliasText] = useState('')

  /** 暂停时间 */
  const [breakDuration, setBreakDuration] = useState(0)

  /** 富文本 */
  const richTextRef = useRef<HTMLDivElement>(null)

  /** 标准化range数据 */
  const normalizedRangeRef = useRef<NormalizedRange | null>()

  /** 当前编辑块的索引 */
  const currentUpdatingBlockIndexRef = useRef(INVALID_INDEX)

  /** 选择范围，根据文字数*/
  const selectRangeByTextBlocksRef = useRef<SelectRange>()

  const initState = () => {
    setIsUpdateBlock(false)
    setAliasText('')
    setBreakDuration(0)
    setEditType(null)
    setSelectDOMRectList([])
    currentUpdatingBlockIndexRef.current = INVALID_INDEX
  }

  const changePopoverOpen = (open: boolean) => {
    !open && initState()
    setOpenPopover(open)
  }

  /**
   * 获取有效的块节点
   *  */
  const getValidityBlocksNode = () => {
    if (!richTextRef.current) return []
    const childNodes = richTextRef.current.childNodes
    return filterValidityBlocksNode(Array.from(childNodes))
  }

  /** 开启编辑 */
  const openEdit = (e: MouseEvent) => {
    if (e.currentTarget) {
      const target = e.currentTarget as HTMLSpanElement
      const type = target.getAttribute(TYPE_PROP)
      const blocksNode = getValidityBlocksNode()

      const index = blocksNode.indexOf(target)
      if (index < 0 || type === null) return

      const currentBlock: Block = blocks[index]

      currentUpdatingBlockIndexRef.current = index

      const rects = target.getClientRects()
      setSelectDOMRectList(Array.from(rects))
      setOpenPopover(true)
      setIsUpdateBlock(true)

      if (isAliasBlockData(currentBlock)) {
        setAliasText(currentBlock.alias || '')
      }

      if (isBreakBlockData(currentBlock)) {
        setBreakDuration(msToS(currentBlock.durationMS))
      }
    }
  }

  const onClickPauseTime = (e: MouseEvent) => {
    setEditType(BREAK)
    openEdit(e)
  }

  const onClickAlias = (e: MouseEvent) => {
    setEditType(ALIAS)
    openEdit(e)
  }

  /** 初始化富文本内容 */
  const initRichTextContent = () => {
    if (!richTextRef.current) return

    const fragment = document.createDocumentFragment()
    blocks.forEach((block) => {
      const { type } = block

      let content = ''
      if (isBreakBlockData(block)) {
        content = `${msToS(block.durationMS).toFixed(1)}s`
      }

      if (isTextBlockData(block)) {
        content = block.text
      }

      const blockNode = createSpanElement(content)

      if (isNotEditable(type)) {
        blockNode.setAttribute('contentEditable', 'false')
      }

      if (isBreakBlockData(block)) {
        blockNode.classList.add(Style['break-block'])
        blockNode.addEventListener('click', onClickPauseTime)
        const icon = createSpanElement('', [
          'iconfont',
          'icon-a-zhibo_icon_time2x',
        ])

        blockNode.insertBefore(icon, blockNode.firstChild)
      }

      blockNode.setAttribute(TYPE_PROP, type)

      if (isAliasBlockData(block)) {
        /** 别名块 */
        const aliasBlock = createSpanElement(block.text, [
          Style['alias-underline'],
        ])

        /** 别名内容块 */
        const aliasContentBlock = createSpanElement(
          ellipsis(block.alias, MAX_RENDER_ALIAS_LENGTH),
          [Style['alias-block']]
        )

        aliasContentBlock.setAttribute(ALIAS_CONTENT, block.alias)
        blockNode.appendChild(aliasBlock)
        blockNode.appendChild(aliasContentBlock)
        blockNode.addEventListener('click', onClickAlias)
      }

      fragment.appendChild(blockNode)
    })

    richTextRef.current.innerHTML = ''
    richTextRef.current.appendChild(fragment)

    /** 添加 br标签 */
    if (blocks.length) {
      ensureBrAtEnd(richTextRef.current)
    }
  }

  const init = (list: Blocks, initRichText = true) => {
    blocks = list
    initRichText && initRichTextContent()
  }

  /** 获取标准化range */
  const getRichTextNormalizedRange = () => {
    const root = richTextRef.current
    if (!root) return

    const range = getSelectionRangeInRoot(root)
    normalizedRangeRef.current = range
  }

  /**
   * 根据root的偏移找到数组索引
   *  */
  const findPositionByRootOffset = (offset: number): Position => {
    let currentIndex = 0
    let remainingLength = 0
    let isEndOffset = false
    const resultIndex = blocks.findIndex((item) => {
      const textLength = getItemTextLength(item)

      if (currentIndex + textLength >= offset) {
        remainingLength = Math.max(offset - currentIndex, 0)
        isEndOffset = remainingLength === textLength
        return true
      }

      currentIndex += textLength
      return false
    })

    return {
      index: resultIndex,
      offset: remainingLength,
      /** 是否是开始偏移 */
      isStartOffset: remainingLength === 0,
      /** 是否是结束偏移 */
      isEndOffset,
    }
  }

  /** 增加停顿 */
  const addBreak = () => {
    const root = richTextRef.current
    if (!root) return

    const normalizedRange = normalizedRangeRef.current

    if (!normalizedRange) {
      message.warning('请先点击正文，选择插入位置')
      return
    }

    const { native, start } = normalizedRange

    if (!native.collapsed) {
      message.warning('请勿框选文字内容')
      return
    }

    const offsetInRoot = getOffsetInRoot(root, start.node, start.offset)

    const { index, offset, isStartOffset, isEndOffset } =
      findPositionByRootOffset(offsetInRoot)

    let currentOffset = offset

    if (index < 0 || index > blocks.length) {
      console.error('没有找到数组中对应的索引')
      return
    }

    const current = blocks[index]

    const content = isBreakBlockData(current)
      ? `${current.durationMS}`
      : current.text

    /** 不是纯文本 && 光标不是最前面 && 最后面，不能插入 */
    if (isNotEditable(current.type) && !isStartOffset && !isEndOffset) return

    /** 因为不可编辑元素计算偏移时，算的是 1，这里手动移动至最后面 */
    if (isNotEditable(current.type) && isEndOffset) {
      currentOffset = content.length
    }

    const before = content.slice(0, currentOffset)
    const after = content.slice(currentOffset)
    const list: Blocks = []

    if (before) list.push(changeBlockContent(before, current))

    list.push({ type: BREAK, durationMS: DEFAULT_PAUSE_TIME_MS })

    if (after) list.push(changeBlockContent(after, current))

    const newTextArr = [...blocks]
    newTextArr.splice(index, 1, ...list)

    /** 初始化 */
    init(newTextArr)

    /** 默认光标定位操作元素的后面，所以需要 +1 */
    let offsetCursor = index + 1
    /** 如果拆分多一个，再 +1 */
    before && (offsetCursor += 1)
    setCursorByOffset(root, offsetCursor)
  }

  /** 删除别名 */
  const removeBreak = () => {
    const currentIndex = currentUpdatingBlockIndexRef.current
    if (currentIndex < 0) return
    const newList = [...blocks]
    newList.splice(currentIndex, 1)
    init(newList)
    changePopoverOpen(false)
  }

  /** 编辑暂停时间 */
  const changeBreak = (value: number) => {
    const currentIndex = currentUpdatingBlockIndexRef.current
    if (currentIndex < 0) return
    const newList = [...blocks]
    const current = blocks[currentIndex]
    if (!isBreakBlockData(current)) return
    setBreakDuration(value)
    current.durationMS = sToMs(value)

    init(newList)
  }

  const findRangeByBlockOffset = (
    startOffset: number,
    endOffset: number
  ): SelectRange => {
    /** 获取range在文字列表中的位置 */
    let start = findPositionByRootOffset(startOffset)
    const end = findPositionByRootOffset(endOffset)

    /**
     * 如果开始位置是block中的结束，往后移一位
     * 保证range 存在一个 Block中
     */
    if (start.isEndOffset) {
      start = {
        index: start.index + 1,
        offset: 0,
        isStartOffset: true,
        isEndOffset: false,
      }
    }

    return {
      start,
      end,
    }
  }

  /** 编辑别名 */
  const editAlias = () => {
    /** 编辑 */
    if (!aliasText) {
      message.warning('别名不能为空')
      return
    }
    const currentIndex = currentUpdatingBlockIndexRef.current
    if (currentIndex < 0) return
    const newList = [...blocks]
    const current = newList[currentIndex]
    if (!isAliasBlockData(current)) return
    current.alias = aliasText

    init(newList)
    changePopoverOpen(false)
  }

  const addAlias = () => {
    const root = richTextRef.current
    if (!root) return

    if (!aliasText) {
      message.warning('请输入别名')
    }

    const selectRange = selectRangeByTextBlocksRef.current

    if (!selectRange) {
      console.error('没有拿到selectRangeByTextBlocksRef')
      return
    }

    const { start, end } = selectRange
    const startIndex = start.index
    const endIndex = end.index

    if (startIndex < 0 || startIndex !== endIndex) {
      console.error('没有找到数组中对应的索引')
      return
    }

    const startOffset = start.offset
    let endOffset = end.offset

    const current = blocks[startIndex]
    if (!current) return

    const { type } = current
    const content = isBreakBlockData(current)
      ? `${current.durationMS}`
      : current.text

    if (isNotEditable(type) && start.isStartOffset && end.isEndOffset) return

    /** 因为不可编辑元素计算偏移时，算的是 1，这里手动移动至最后面 */
    if (isNotEditable(current.type) && end.isEndOffset) {
      endOffset = content.length
    }

    const before = content.slice(0, startOffset)
    const alias = content.slice(startOffset, endOffset)
    const after = content.slice(endOffset)

    const list: Blocks = []
    if (before) list.push(changeBlockContent(before, current))

    if (alias) {
      list.push({
        type: ALIAS,
        text: alias,
        alias: aliasText,
      })
    }

    if (after) list.push(changeBlockContent(after, current))

    const newTextList = [...blocks]
    newTextList.splice(startIndex, 1, ...list)

    init(newTextList)
    changePopoverOpen(false)

    /** 默认光标定位操作元素的后面，所以需要 +1 */
    let offsetCursor = startIndex + 1
    /** 如果拆分多一个，再 +1 */
    before && (offsetCursor += 1)
    setCursorByOffset(root, offsetCursor)
  }

  /** 删除别名 */
  const removeAlias = () => {
    const currentIndex = currentUpdatingBlockIndexRef.current
    if (currentIndex < 0) return
    const newList = [...blocks]
    newList[currentIndex].type = TEXT
    Reflect.deleteProperty(newList[currentIndex], 'alias')

    init(newList)
    changePopoverOpen(false)
  }

  /** 确认别名  新增 | 编辑 */
  const confirmAlias = () => {
    isUpdateBlock ? editAlias() : addAlias()
  }

  const openAddAliasPopover = () => {
    const root = richTextRef.current
    if (!root) return

    const normalizedRange = normalizedRangeRef.current

    if (!normalizedRange || normalizedRange.native.collapsed) {
      message.warning('请框选添加别名文字内容')
      return
    }

    const { native, end, start } = normalizedRange

    if (isTextWithNewlinesForRange(native)) {
      message.warning('换行不支持别名')
      return
    }

    const selectText = native.toString()
    if (selectText.length > MAX_ALIAS_TEXT_LENGTH) {
      message.warning(`添加别名的文本不能超过${MAX_ALIAS_TEXT_LENGTH}个字符`)
      return
    }

    /** 获取光标在root中的位置 */
    const startOffset = getOffsetInRoot(root, start.node, start.offset)
    const endOffset = getOffsetInRoot(root, end.node, end.offset)

    const rectList = Array.from(native?.getClientRects() || [])

    /** 合并纯文本 */
    blocks = mergePlainText(blocks)

    /** 获取range在文字列表中的位置 */
    const { start: startPosition, end: endPosition } = findRangeByBlockOffset(
      startOffset,
      endOffset
    )

    if (startPosition.index !== endPosition.index) {
      message.warning('选中区域，请勿夹杂别名或停顿')
      return
    }

    selectRangeByTextBlocksRef.current = {
      start: startPosition,
      end: endPosition,
    }

    setSelectDOMRectList(rectList)
    setEditType(ALIAS)
    setOpenPopover(true)
  }

  const handleUpdate = () => {
    const blocks = getValidityBlocksNode()

    const texts: Blocks = blocks.map((item) => {
      const block = item as HTMLElement
      const text = block.innerText || block.textContent || ''

      if (block instanceof Text) {
        return { type: TEXT, text }
      }
      const type = block.getAttribute(TYPE_PROP) as BlockType
      if (isBreakBlock(type)) {
        return {
          durationMS: sToMs(parseFloat(text)),
          type: BREAK,
        }
      }

      if (isAliasBlock(type) && block.childNodes.length === 2) {
        const textNode = block.childNodes[0] as HTMLSpanElement
        const aliasNode = block.childNodes[1] as HTMLSpanElement
        const alias =
          aliasNode.getAttribute(ALIAS_CONTENT) || aliasNode.textContent || ''

        return {
          alias,
          text: textNode.textContent || '',
          type: ALIAS,
        }
      }

      return {
        type: TEXT,
        text,
      }
    })

    init(texts, false)
  }

  /** 防抖更新数据 */
  const { run: onUpdate } = useDebounceFn(handleUpdate, { wait: 200 })

  const handleInput = (e: ChangeEvent<HTMLDivElement>) => {
    const firstChild = e.target.firstChild
    if (firstChild && isBrElement(firstChild)) {
      /** 防止浏览器主动增加br元素，导致换行 */
      firstChild.remove()
    }

    onUpdate()
  }

  const findDeleteBlockIndexByRange = (position: Position, forward = true) => {
    const { index, offset } = position

    const current = blocks[index]
    if (!current) return INVALID_INDEX
    const { type } = current

    const currentTextLength = getItemTextLength(current)
    const isFirst = offset === 0
    const isLast = offset === currentTextLength

    if (!isFirst && !isLast && isTextBlock(type)) return INVALID_INDEX

    if (forward) {
      return isFirst ? index - 1 : index
    }

    return isLast ? index + 1 : index
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const {
      key,
      // metaKey, ctrlKey
    } = e
    // const ctrl = metaKey || ctrlKey;
    const root = richTextRef.current
    if (!root) return

    /** 删除 */
    if ([BACKSPACE_KEY, DELETE_KEY].includes(key)) {
      const isBackspace = key === BACKSPACE_KEY
      const range = getSelectionRangeInRoot(root)
      /** 如果是框选删除，则暂时不处理 */
      if (!range || !range.native.collapsed) return
      const { start } = range
      const offset = getOffsetInRoot(root, start.node, start.offset)

      /** 先保存数据，防止不是最新数据 */
      handleUpdate()
      /** 获取range在文字列表中的位置 */
      const position = findPositionByRootOffset(offset)

      const currentTextIndex = findDeleteBlockIndexByRange(
        position,
        isBackspace
      )

      if (currentTextIndex < 0 || currentTextIndex > blocks.length) return

      const newList = [...blocks]
      const currentBlock = newList[currentTextIndex]

      if (([ALIAS, BREAK] as string[]).includes(currentBlock.type)) {
        /** 阻止自动删除 */
        e.preventDefault()

        /** 光标的位置 */
        let offsetCursor = currentTextIndex

        if (isAliasBlock(currentBlock.type)) {
          if (isBackspace) {
            offsetCursor += 1
          }

          currentBlock.type = TEXT
          Reflect.deleteProperty(currentBlock, 'alias')
        }

        if (isBreakBlock(currentBlock.type)) {
          newList.splice(currentTextIndex, 1)
        }

        init(newList)
        setCursorByOffset(root, offsetCursor)
      }
    }
  }

  const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault()
    /** 获取粘贴的纯文本内容 */
    const clipboardData = event.clipboardData || window.Clipboard
    /** windows 系统中、复制过来的文本换行格式为 \r\n ，插入暂停会出现位置错乱,这里过滤\r */
    const pastedText = clipboardData.getData('text/plain').replaceAll('\r', '')

    /** 将纯文本内容插入到可编辑元素中 */
    const selection = window.getSelection()
    if (!selection) {
      console.error('没有selection对象')
      return
    }
    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(pastedText))
    range.collapse(false)
    /** 更新数据 */
    onUpdate()
  }

  const getRichTextRect = () => richTextRef.current?.getBoundingClientRect()

  useEffect(() => {
    initRichTextContent()
  }, [])

  return (
    <div className={Style['rich-text-insert-block']}>
      <div>
        <Button
          style={{ marginRight: 20 }}
          onMouseDown={getRichTextNormalizedRange}
          onClick={openAddAliasPopover}
        >
          别名
        </Button>
        <Button
          type="primary"
          onMouseDown={getRichTextNormalizedRange}
          onClick={addBreak}
        >
          停顿
        </Button>
      </div>

      <div className={Style['rich-text-container']}>
        {/* 富文本 */}
        <div
          ref={richTextRef}
          contentEditable
          className={Style['rich-text']}
          placeholder="请输入文案"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />

        {/* 气泡弹窗 */}
        <TextBlockPopover
          open={openPopover}
          selectDOMRectList={selectDOMRectList}
          blockType={editType}
          isUpdateBlock={isUpdateBlock}
          aliasText={aliasText}
          breakDuration={breakDuration}
          changeAliasText={setAliasText}
          removeAlias={removeAlias}
          confirmAlias={confirmAlias}
          removeBreak={removeBreak}
          changeBreak={changeBreak}
          onOpenChange={changePopoverOpen}
          getRichTextRect={getRichTextRect}
        />
      </div>
    </div>
  )
}
