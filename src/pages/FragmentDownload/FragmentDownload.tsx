import pLimit from 'p-limit'
import { Button } from 'antd'

const videoUrl =
  'https://vod-mtv-private.oss-cn-beijing.aliyuncs.com/customFigure/training/2023/11/15/20/1080x1920/75f58636fb1800546a9b754f227d70af.mp4'

// const videoUrl =
//   'https://vod-mtv-private.oss-cn-beijing.aliyuncs.com/customFigure/training/2024/03/26/18/2160x3840/e7896a8cc39c78ee50cec66c63e182f8.mp4'

// const videoUrl =
//   'https://vod-mtv-private.oss-cn-beijing.aliyuncs.com/customFigure/training/2024/04/17/15/1080x1920/096e39fe69d36bc3ceef6bbe93570d04.mp4'

function getContentLengthForUrl(url: string) {
  return fetch(url, {
    method: 'HEAD',
  })
    .then((response) => {
      return response.headers.get('content-length')
    })
    .catch((error) => {
      console.error(error)
      return ''
    })
}

function getBlobByRange(url: string, range: string) {
  return fetch(url, {
    headers: { Range: range },
  })
    .then((res) => {
      return res.blob()
    })
    .then((res) => {
      return res
    })
}

function sliceFragments(size: number, unit: number) {
  const list = []
  if (size <= unit) {
    list.push(size)
    return list
  }

  let step = 0

  while (size > step) {
    const data = Math.min(size - step, unit)
    step += data
    list.push(step)
  }

  return list
}

/** 2MB */
const bytes = 1024 * 1024 * 2

export default function FragmentDownload() {
  const fragmentDownload = async () => {
    console.time('分片下载')
    const contentLength = await getContentLengthForUrl(videoUrl)
    if (!contentLength) return
    const size = parseInt(contentLength)
    const fragments = sliceFragments(size, bytes)
    console.log(fragments, size)

    const limit = pLimit(6)

    Promise.all(
      fragments.map(async (item, index) => {
        return limit(async () => {
          const ranges = []
          index === 0 ? ranges.push(0) : ranges.push(fragments[index - 1])
          ranges.push(item)
          const range = `bytes=${ranges.join('-')}`
          const blob = await getBlobByRange(videoUrl, range)
          console.log(blob)
          return blob
        })
      })
    ).then((data) => {
      console.log(data)
      console.timeEnd('分片下载')
    })
  }

  const normalDownload = () => {
    console.time('普通下载：')
    fetch(videoUrl)
      .then((res) => {
        return res.blob()
      })
      .then((blob) => {
        console.log('blob:', blob)
        console.timeEnd('普通下载：')
        return blob
      })
  }

  return (
    <div>
      <Button type="primary" onClick={fragmentDownload}>
        分片下载
      </Button>

      <Button style={{ marginLeft: 10 }} onClick={normalDownload}>
        普通下载
      </Button>
    </div>
  )
}
