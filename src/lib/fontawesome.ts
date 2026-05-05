import { config, library } from '@fortawesome/fontawesome-svg-core'
import { faFlag, faFolder, faFile, faFileImage, faFileVideo, faFileAudio, faFilePdf } from '@fortawesome/free-regular-svg-icons'
import {
  faArrowRight,
  faCheck,
  faChevronCircleDown,
  faDownload,
  faExternalLinkAlt,
  faHome,
  faKey,
  faSearch,
  faTh,
  faThList,
} from '@fortawesome/free-solid-svg-icons'

config.autoAddCss = false

library.add(
  faArrowRight,
  faCheck,
  faChevronCircleDown,
  faDownload,
  faExternalLinkAlt,
  faFile,
  faFileAudio,
  faFileImage,
  faFilePdf,
  faFileVideo,
  faFlag,
  faFolder,
  faHome,
  faKey,
  faSearch,
  faTh,
  faThList
)
