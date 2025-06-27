import { useRef } from 'react';
import { useAsync } from 'react-use';
import styled from 'styled-components';

import { decrypt } from '@wsh-2024/image-encrypt/src/decrypt';

import { getImageUrl } from '../../../lib/image/getImageUrl';
import { performanceLogger, useRenderPerformance } from '../../../lib/performance';

const _Canvas = styled.canvas`
  height: 100%;
  width: auto;
  flex-grow: 0;
  flex-shrink: 0;
`;

type Props = {
  pageImageId: string;
};

export const ComicViewerPage = ({ pageImageId }: Props) => {
  useRenderPerformance('ComicViewerPage', [pageImageId]);
  
  const ref = useRef<HTMLCanvasElement>(null);

  useAsync(async () => {
    performanceLogger.start(`ComicViewerPage-${pageImageId}`, { pageImageId });
    
    const image = new Image();
    image.src = getImageUrl({
      format: 'jxl',
      imageId: pageImageId,
    });
    
    performanceLogger.start(`Image-decode-${pageImageId}`);
    await image.decode();
    performanceLogger.end(`Image-decode-${pageImageId}`);

    const canvas = ref.current!;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d')!;

    performanceLogger.start(`Image-decrypt-${pageImageId}`);
    decrypt({
      exportCanvasContext: ctx,
      sourceImage: image,
      sourceImageInfo: {
        height: image.naturalHeight,
        width: image.naturalWidth,
      },
    });
    performanceLogger.end(`Image-decrypt-${pageImageId}`);

    canvas.setAttribute('role', 'img');
    
    performanceLogger.end(`ComicViewerPage-${pageImageId}`);
  }, [pageImageId]);

  return <_Canvas ref={ref} />;
};
