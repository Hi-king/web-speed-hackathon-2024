import { useSetAtom } from 'jotai';
import React, { useId } from 'react';
import styled from 'styled-components';

import { DialogContentAtom } from '../atoms/DialogContentAtom';
import { COMPANY } from '../constants/Company';
import { CONTACT } from '../constants/Contact';
import { OVERVIEW } from '../constants/Overview';
import { QUESTION } from '../constants/Question';
import { TERM } from '../constants/Term';
import { Color, Space, Typography } from '../styles/variables';
import { useRenderPerformance } from '../../lib/performance';

import { Box } from './Box';
import { Button } from './Button';
import { Flex } from './Flex';
import { Spacer } from './Spacer';
import { Text } from './Text';

const _Button = styled(Button)`
  color: ${Color.MONO_A};
  /* レイアウトシフトを防ぐためのスタイル */
  min-height: 40px;
  transition: none;
`;

const _Content = styled.section`
  white-space: pre-line;
`;

const _Logo = styled.img`
  /* 画像のサイズを明示的に指定してレイアウトシフトを防ぐ */
  width: 160px;
  height: 40px;
  /* 画像が読み込まれる前のプレースホルダー */
  background-color: transparent;
  /* 画像の読み込みを高速化 */
  loading: eager;
`;

const _FooterContainer = styled(Box)`
  /* フッターのサイズを固定してレイアウトシフトを防ぐ */
  min-height: 120px;
`;

export const Footer: React.FC = () => {
  useRenderPerformance('Footer');
  
  // レイアウトシフトを防ぐため、初期状態でもボタンを有効にする
  // ただし、ダイアログが開く前にクライアントサイドの準備が整うまで待つ
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // 次のフレームで実行してスムーズな遷移を実現
    const timeoutId = setTimeout(() => {
      setIsReady(true);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const termDialogA11yId = useId();
  const contactDialogA11yId = useId();
  const questionDialogA11yId = useId();
  const companyDialogA11yId = useId();
  const overviewDialogA11yId = useId();

  const updateDialogContent = useSetAtom(DialogContentAtom);

  const handleRequestToTermDialogOpen = () => {
    // 準備が整っていない場合は何もしない（レイアウトシフトを防ぐ）
    if (!isReady) return;
    
    updateDialogContent(
      <_Content aria-labelledby={termDialogA11yId} role="dialog">
        <Text as="h2" color={Color.MONO_100} id={termDialogA11yId} typography={Typography.NORMAL16}>
          利用規約
        </Text>
        <Spacer height={Space * 1} />
        <Text as="p" color={Color.MONO_100} typography={Typography.NORMAL12}>
          {TERM}
        </Text>
      </_Content>,
    );
  };

  const handleRequestToContactDialogOpen = () => {
    if (!isReady) return;
    
    updateDialogContent(
      <_Content aria-labelledby={contactDialogA11yId} role="dialog">
        <Text as="h2" color={Color.MONO_100} id={contactDialogA11yId} typography={Typography.NORMAL16}>
          お問い合わせ
        </Text>
        <Spacer height={Space * 1} />
        <Text as="p" color={Color.MONO_100} typography={Typography.NORMAL12}>
          {CONTACT}
        </Text>
      </_Content>,
    );
  };

  const handleRequestToQuestionDialogOpen = () => {
    if (!isReady) return;
    
    updateDialogContent(
      <_Content aria-labelledby={questionDialogA11yId} role="dialog">
        <Text as="h2" color={Color.MONO_100} id={questionDialogA11yId} typography={Typography.NORMAL16}>
          Q&A
        </Text>
        <Spacer height={Space * 1} />
        <Text as="p" color={Color.MONO_100} typography={Typography.NORMAL12}>
          {QUESTION}
        </Text>
      </_Content>,
    );
  };

  const handleRequestToCompanyDialogOpen = () => {
    if (!isReady) return;
    
    updateDialogContent(
      <_Content aria-labelledby={companyDialogA11yId} role="dialog">
        <Text as="h2" color={Color.MONO_100} id={companyDialogA11yId} typography={Typography.NORMAL16}>
          運営会社
        </Text>
        <Spacer height={Space * 1} />
        <Text as="p" color={Color.MONO_100} typography={Typography.NORMAL12}>
          {COMPANY}
        </Text>
      </_Content>,
    );
  };

  const handleRequestToOverviewDialogOpen = () => {
    if (!isReady) return;
    
    updateDialogContent(
      <_Content aria-labelledby={overviewDialogA11yId} role="dialog">
        <Text as="h2" color={Color.MONO_100} id={overviewDialogA11yId} typography={Typography.NORMAL16}>
          Cyber TOONとは
        </Text>
        <Spacer height={Space * 1} />
        <Text as="p" color={Color.MONO_100} typography={Typography.NORMAL12}>
          {OVERVIEW}
        </Text>
      </_Content>,
    );
  };

  return (
    <_FooterContainer as="footer" backgroundColor={Color.Background} p={Space * 1}>
      <Flex align="flex-start" direction="column" gap={Space * 1} justify="flex-start">
        <_Logo alt="Cyber TOON" src="/assets/cyber-toon.svg" />
        <Flex align="start" direction="row" gap={Space * 1.5} justify="center">
          <_Button onClick={handleRequestToTermDialogOpen}>
            利用規約
          </_Button>
          <_Button onClick={handleRequestToContactDialogOpen}>
            お問い合わせ
          </_Button>
          <_Button onClick={handleRequestToQuestionDialogOpen}>
            Q&A
          </_Button>
          <_Button onClick={handleRequestToCompanyDialogOpen}>
            運営会社
          </_Button>
          <_Button onClick={handleRequestToOverviewDialogOpen}>
            Cyber TOONとは
          </_Button>
        </Flex>
      </Flex>
    </_FooterContainer>
  );
};
