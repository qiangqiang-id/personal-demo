/**
 * 纯文本
 *  */
export interface TextBlock {
  type: 'text'
  text: string
}

/**
 * 别名
 *  */
export interface AliasBlock {
  type: 'alias'
  text: string
  alias: string
}

/**
 * 停顿
 *  */
export interface BreakBlock {
  type: 'break'
  durationMS: number
}

export type Block = TextBlock | AliasBlock | BreakBlock

export type Blocks = Block[]
