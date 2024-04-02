export type NativeRange = Range

export interface NormalizedRange {
  start: {
    node: NativeRange['startContainer']
    offset: NativeRange['startOffset']
  }
  end: { node: NativeRange['endContainer']; offset: NativeRange['endOffset'] }
  native: NativeRange
}

export interface Position {
  /** 索引 */
  index: number
  /** 偏移 */
  offset: number
  /** 是否是开始偏移 */
  isStartOffset: boolean
  /** 是否是结束偏移 */
  isEndOffset: boolean
}

export interface SelectRange {
  start: Position
  end: Position
}
