import React from "react"
import { MatrixEvent } from "matrix-js-sdk"
import { IFileContent } from "../../../types/matrix/common"
import {
  Attachment,
  AttachmentBox,
  AttachmentContent,
  AttachmentHeader
} from "../../../components/message"
import { FileHeader } from "./FileHeader"
import { FileContent } from "./FileContent"
import {
  FALLBACK_MIMETYPE,
  getBlobSafeMimeType
} from "../../../utils/mimeTypes"
import { scaleYDimension } from "../../../utils/common"

export const fileRenderer = (mEventId: string, mEvent: MatrixEvent) => {
  const content = mEvent.getContent()
  let mediaMXC
  let mimeType
  let file
  let msgType
  let height
  let mType
  let safeMimeType

  if (content.attachments?.length) {
    mediaMXC = content?.attachments[0]?.url?.content_uri
    mimeType = content?.attachments[0]?.info?.type

    file = content?.attachments[0]?.info
    msgType = content?.attachments
      ? content?.attachments[0]?.info.mtype
      : MsgType.File

    height = scaleYDimension(
      content?.attachments[0]?.info?.w || 400,
      400,
      content?.attachments[0]?.info?.h || 400
    )
    mType = content?.attachments[0]?.info?.mtype
    safeMimeType = getBlobSafeMimeType(mimeType ?? "")
  }

  // const content = mEvent.getContent<IFileContent>()

  // const fileInfo = content?.info
  // const mxcUrl = content.file?.url ?? content.url

  // if (typeof mxcUrl !== "string") {
  //   return null
  // }

  return (
    <Attachment>
      <AttachmentHeader>
        <FileHeader
          body={content.body ?? "Unnamed File"}
          mimeType={mimeType ?? FALLBACK_MIMETYPE}
        />
      </AttachmentHeader>
      <AttachmentBox>
        <AttachmentContent>
          <FileContent
            body={content.body ?? "File"}
            info={file ?? {}}
            mimeType={mimeType ?? FALLBACK_MIMETYPE}
            url={mediaMXC}
            // encInfo={content.file}
          />
        </AttachmentContent>
      </AttachmentBox>
    </Attachment>
  )
}
