import { Popover, InputNumber, Button, Input } from 'antd'
import cls from 'classnames'
import BlockType from '@/constants/RichTextBlockTypeEnum'
import Style from './TextBlockPopover.module.less'

const MAX_PAUSE_TIME = 3
const MIN_PAUSE_TIME = 0.1

const { TEXT, BREAK, ALIAS } = BlockType

interface TextBlockPopoverProps {
  open?: boolean
  selectDOMRectList?: DOMRect[]
  blockType?: BlockType | null
  isUpdateBlock?: boolean
  /** 别名 */
  aliasText?: string
  changeAliasText?: (val: string) => void
  removeAlias?: () => void
  confirmAlias?: () => void

  /** 暂停 */
  breakDuration?: number
  removeBreak?: () => void
  changeBreak?: (val: number) => void

  onOpenChange?: (open: boolean) => void

  getRichTextRect: () => DOMRect | undefined
}

export default function TextBlockPopover(props: TextBlockPopoverProps) {
  const {
    selectDOMRectList: rectList = [],
    open,
    blockType,
    isUpdateBlock,
    aliasText,
    breakDuration,
    removeAlias,
    confirmAlias,
    changeAliasText,
    changeBreak,
    removeBreak,
    onOpenChange,
    getRichTextRect,
  } = props

  const addPauseTimeValue = () => {
    if (breakDuration === undefined) return
    /** 处理精度丢失 */
    const value =
      (Math.round(breakDuration * 100) + Math.round(MIN_PAUSE_TIME * 100)) / 100
    const time = Math.min(MAX_PAUSE_TIME, value)
    changeBreak?.(time)
  }

  const subPauseTimeValue = () => {
    if (breakDuration === undefined) return

    /** 处理精度丢失 */
    const value =
      (Math.round(breakDuration * 100) - Math.round(MIN_PAUSE_TIME * 100)) / 100
    const time = Math.max(MIN_PAUSE_TIME, value)
    changeBreak?.(time)
  }

  const getStyle = (rect?: DOMRect) => {
    if (!rect) return {}
    const { top, left, width, height } = rect

    const richTextRect = getRichTextRect()
    const richTextTop = richTextRect?.top || 0
    const richTextLeft = richTextRect?.left || 0

    return {
      width,
      height,
      left: left - richTextLeft,
      top: top - richTextTop,
    }
  }

  const renderAliasPopoverContent = (
    <div className={Style['popover-content-alias']}>
      <Input
        value={aliasText}
        placeholder="请输入别名"
        maxLength={40}
        className={Style['alias-input']}
        allowClear
        onChange={(e) => {
          changeAliasText?.(e.target.value)
        }}
      />
      <div className={Style.desc}>例如：设置「YYDS」为「永远的神」</div>

      <div className={Style['btn-box']}>
        {isUpdateBlock && (
          <Button className={Style.btn} onClick={removeAlias}>
            移除
          </Button>
        )}
        <Button className={Style.btn} type="primary" onClick={confirmAlias}>
          确定
        </Button>
      </div>
    </div>
  )

  const renderPauseTimePopoverContent = (
    <div className={Style['popover-content-pause-time']}>
      <div className={Style.sub} onClick={subPauseTimeValue}>
        —
      </div>
      <InputNumber
        value={breakDuration}
        controls={false}
        min={MIN_PAUSE_TIME}
        max={MAX_PAUSE_TIME}
        className={Style['pause-time-input']}
        formatter={(value) => `${value}s`}
        parser={(value) => {
          /** 过滤s，取一位小数 */
          const result = Number(value?.replace('s', ''))
          return +result.toFixed(1)
        }}
        onChange={(value) => {
          value !== null && changeBreak?.(value)
        }}
      />
      <div className={Style.add} onClick={addPauseTimeValue}>
        +
      </div>
      <i
        className={cls('iconfont icon-a-pop_icon_delete2x', Style.delete)}
        onClick={removeBreak}
      />
    </div>
  )

  const contentMap = {
    [BREAK]: renderPauseTimePopoverContent,
    [ALIAS]: renderAliasPopoverContent,
    [TEXT]: null,
  }

  return (
    <>
      <Popover
        rootClassName={Style.popover}
        open={open}
        content={blockType && contentMap[blockType]}
        trigger="click"
        placement="bottomRight"
        onOpenChange={onOpenChange}
      >
        <div
          style={getStyle(rectList[0])}
          className={Style['popover-child-block']}
        />
      </Popover>

      {/* 阴影 */}
      {rectList.slice(1).map((rect, index) => (
        <div
          key={`${String(index)}_${String(rect.left)}`}
          style={getStyle(rect)}
          className={Style['popover-child-block']}
        />
      ))}
    </>
  )
}
