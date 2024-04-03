import { useRef, useState } from 'react'
import { Button, Image } from 'antd'
import dom2Image from './Dom2Image'
import Style from './Screenshot.module.less'

const content =
  '还在纠结开店成本高不挣钱吗 上市大平台紫燕百味鸡来帮您 降低前期开店成本 紫燕帮您开店省时省力更省心 线上运营引流客单量 线下经营更轻松 早中晚夜宵四餐融合 完善供应链 轻松配送降低物料损耗 全程一站式专业指导开店 赶紧点击视频下方链接咨询吧'

export default function Screenshot() {
  const canvasRef = useRef<HTMLDivElement>(null)

  const [blobUrl, setBlobUrl] = useState('')

  const screenshot = async () => {
    const node = canvasRef.current
    if (!node) {
      return
    }
    const blob = await dom2Image(node, {
      style: { transform: 'none' },
      type: 'image/jpeg',
    })

    setBlobUrl(URL.createObjectURL(blob))
  }

  return (
    <div className={Style['screen-shot']}>
      <Button type="primary" onClick={screenshot}>
        截图
      </Button>

      <div className={Style.preview}>
        <div className={Style.canvas} ref={canvasRef}>
          <img
            className={Style.image}
            src="http://img.miaotui.com/document/2021/09/26/18/1c671ca5b9bdf99d2364481dbf7d4ae8.png"
          />
          <p className={Style.text}>{content}</p>
          <img
            className={Style.image}
            src="https://img.miaotui.com/common/mtv/2022/06/09/13/9680ed34cead84b7513dafcfa7ab73a5.png"
          />
          <p className={Style.text}>{content}</p>
        </div>

        <Image src={blobUrl} width={500} height={1000} />
      </div>
    </div>
  )
}
